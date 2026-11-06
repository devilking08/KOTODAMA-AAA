extends CharacterBody3D
class_name KotodamaPlayer

## Third-person melee controller (KOTODAMA Godot port) — v2 feel pass.
## Movement: WASD + mouse + sprint. Defense: dodge (i-frames) + parry stance.
## Combat: 3-hit combo chain with input buffering, dash-attack, riposte after
## posture break, soft lock-on. Hitstop on heavy hits. All tuning is @export
## (data-driven) and frame-rate independent.

signal health_changed(current: float, maximum: float)
signal posture_changed(current: float, maximum: float)
signal dodged(perfect: bool)
signal parried
signal lock_target_changed(target: Node3D)
signal riposte_available

@export var walk_speed := 6.0
@export var sprint_speed := 10.5
@export var accel := 14.0
@export var gravity := 24.0
@export var dodge_speed := 13.0
@export var dodge_duration := 0.28
@export var dodge_cooldown := 0.55
@export var max_health := 120.0
@export var max_posture := 100.0

# ── Combat tuning (data-driven; all tunable without touching code) ───────
@export var combo_damage: Array[float] = [26.0, 30.0, 42.0]
@export var combo_window := 0.8          # seconds to chain the next strike
@export var input_buffer := 0.18         # attack press buffering window
@export var dash_attack_damage := 32.0
@export var riposte_damage := 60.0
@export var posture_damage_per_hit: Array[float] = [10.0, 12.0, 22.0]
@export var lockon_range := 18.0
@export var lockon_cone_dot := 0.35      # forward-cone dot threshold for auto-target

var health := max_health
var posture := max_posture
var yaw := 0.0
var pitch := -0.18

var guarding := false
var guard_timer := 0.0
var dodge_timer := 0.0
var dodge_dir := Vector3.ZERO
var invuln_timer := 0.0
var stagger_timer := 0.0

# Combo / attack state (explicit transitions only)
var combo_steps := 0
var combo_timer := 0.0
var attack_buffer := 0.0
var attack_cd := 0.0
var dash_attack_pending := false
var riposte_ready := false
var lock_target: Node3D

@onready var pivot: Node3D = get_node_or_null("CameraPivot") as Node3D
@onready var slash_area: Area3D = get_node_or_null("SlashArea") as Area3D
@onready var body_mesh: MeshInstance3D = get_node_or_null("BodyMesh") as MeshInstance3D

func _ready() -> void:
	add_to_group("player")
	health_changed.emit(health, max_health)
	posture_changed.emit(posture, max_posture)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		yaw -= event.relative.x * 0.0032
		pitch = clampf(pitch - event.relative.y * 0.0032, -1.15, 0.6)
		if pivot != null:
			pivot.rotation = Vector3(pitch, 0.0, 0.0)

func _physics_process(delta: float) -> void:
	_tick_timers(delta)
	_update_lockon()

	if stagger_timer > 0.0:
		velocity = velocity.lerp(Vector3.ZERO, minf(1.0, 8.0 * delta))
		_ground_snap()
		return

	if dodge_timer > 0.0:
		velocity = dodge_dir * dodge_speed
		if dash_attack_pending:
			_resolve_attack(dash_attack_damage, 14.0, true)
			dash_attack_pending = false
		_ground_snap()
		return

	var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var wish := (transform.basis * Vector3(input_dir.x, 0.0, input_dir.y)).normalized()

	# Dodge
	if Input.is_action_just_pressed("dodge") and dodge_cooldown <= 0.0:
		dodge_dir = wish if wish.length_squared() > 0.01 else Vector3(-sin(yaw), 0.0, -cos(yaw))
		dodge_dir.y = 0.0
		dodge_dir = dodge_dir.normalized()
		dodge_timer = dodge_duration
		dodge_cooldown = dodge_cooldown + dodge_duration
		invuln_timer = maxf(invuln_timer, dodge_duration + 0.08)
		dodged.emit(true)
		return

	# Parry stance (hold Q): quick-guard window at press time
	if Input.is_action_just_pressed("parry"):
		guarding = true
		guard_timer = 0.0
	if not Input.is_action_pressed("parry"):
		guarding = false

	if not is_on_floor():
		velocity.y -= gravity * delta

	var speed := sprint_speed if Input.is_action_pressed("sprint") and input_dir.y < -0.2 else walk_speed
	var target := wish * speed
	var k := minf(1.0, accel * delta)
	velocity.x = lerpf(velocity.x, target.x, k)
	velocity.z = lerpf(velocity.z, target.z, k)

	# Face movement / lock-on target while attacking or moving
	var face_target := yaw
	if lock_target != null and (combo_steps > 0 or riposte_ready):
		var to_t := lock_target.global_position - global_position
		face_target = atan2(to_t.x, to_t.z)
	elif wish.length_squared() > 0.01:
		face_target = atan2(wish.x, wish.z)
	rotation.y = lerp_angle(rotation.y, face_target, minf(1.0, 12.0 * delta))
	_ground_snap()

	# Posture recovery
	posture = minf(max_posture, posture + (6.0 if guarding else 11.0) * delta * 0.1)

func _tick_timers(delta: float) -> void:
	guard_timer += delta
	dodge_timer = maxf(dodge_timer - delta, 0.0)
	dodge_cooldown = maxf(dodge_cooldown - delta, 0.0)
	invuln_timer = maxf(invuln_timer - delta, 0.0)
	stagger_timer = maxf(stagger_timer - delta, 0.0)
	attack_cd = maxf(attack_cd - delta, 0.0)
	attack_buffer = maxf(attack_buffer - delta, 0.0)
	combo_timer = combo_timer - delta
	if combo_timer <= 0.0 and combo_steps > 0:
		combo_steps = 0
	if Input.is_action_just_pressed("attack"):
		attack_buffer = input_buffer

func _update_lockon() -> void:
	var best: Node3D
	var best_score := LOCKON_CONE_DOT
	var fwd := -transform.basis.z
	for body in get_tree().get_nodes_in_group("enemy"):
		if not is_instance_valid(body) or not body.has_method("is_defeated"):
			continue
		if body.is_defeated():
			continue
		var to := body.global_position - global_position
		var dist := to.length()
		if dist > lockon_range:
			continue
		var dot := to.normalized().dot(fwd)
		if dot > best_score:
			best_score = dot
			best = body
	if best != lock_target:
		lock_target = best
		lock_target_changed.emit(lock_target)

func try_attack() -> void:
	if stagger_timer > 0.0 or attack_cd > 0.0:
		return
	# Riposte overrides everything when it is available.
	if riposte_ready:
		_resolve_attack(riposte_damage, 26.0, true)
		riposte_ready = false
		attack_cd = 0.6
		return
	if dodge_timer > 0.0:
		dash_attack_pending = true
		return
	var step := combo_steps
	var dmg := combo_damage[min(step, combo_damage.size() - 1)]
	var posture_dmg := posture_damage_per_hit[min(step, posture_damage_per_hit.size() - 1)]
	_resolve_attack(dmg, posture_dmg, step == 2)
	combo_steps = (step + 1) % combo_damage.size()
	combo_timer = combo_window
	attack_cd = 0.35 if step < 2 else 0.6

func _resolve_attack(damage: float, posture_damage: float, heavy: bool) -> void:
	if slash_area == null:
		return
	var hit := false
	for body in slash_area.get_overlapping_bodies():
		if body.is_in_group("enemy") and body.has_method("take_damage"):
			body.take_damage(damage, posture_damage)
			hit = true
			if body.has_method("get_posture") and body.get_posture() <= 0.0 and not riposte_ready:
				riposte_ready = true
				riposte_available.emit()
	if hit:
		_twitch(heavy)
		if heavy:
			Engine.time_scale = 0.3
			await get_tree().create_timer(0.1).timeout
			Engine.time_scale = 1.0

func _twitch(heavy: bool) -> void:
	if body_mesh == null:
		return
	var s := 1.14 if heavy else 1.12
	body_mesh.scale = Vector3(s, 0.9, s)
	await get_tree().create_timer(0.08).timeout
	if is_instance_valid(body_mesh):
		body_mesh.scale = Vector3.ONE

func take_damage(amount: float) -> void:
	if health <= 0.0 or invuln_timer > 0.0:
		return
	# Perfect parry window: first 0.18s of guard stance negates and retaliates.
	if guarding and guard_timer <= 0.18:
		parried.emit()
		posture = minf(max_posture, posture + 12.0)
		guard_timer = 99.0
		return
	var blocked := guarding
	var taken := amount * (0.25 if blocked else 1.0)
	health = maxf(health - taken, 0.0)
	posture = maxf(posture - amount * 0.8, 0.0)
	health_changed.emit(health, max_health)
	posture_changed.emit(posture, max_posture)
	if taken >= 20.0:
		Engine.time_scale = 0.35
		await get_tree().create_timer(0.1).timeout
		Engine.time_scale = 1.0

func rest() -> void:
	health = max_health
	posture = max_posture
	combo_steps = 0
	riposte_ready = false
	health_changed.emit(health, max_health)
	posture_changed.emit(posture, max_posture)

func _ground_snap() -> void:
	move_and_slide()
	var terrain := get_parent().get_node_or_null("Terrain")
	if terrain != null and terrain.has_method("sample_height"):
		var h: float = terrain.sample_height(global_position.x, global_position.z)
		global_position.y = h + 0.9
