extends CharacterBody3D
class_name KotodamaPlayer

## Third-person melee controller (KOTODAMA Godot port).
## Movement: WASD + mouse + sprint. Defense: dodge (i-frames) + parry stance.
## Combat: Area3D slash hitbox; posture-based exchanges.

signal health_changed(current: float, maximum: float)
signal posture_changed(current: float, maximum: float)
signal dodged(perfect: bool)
signal parried

@export var walk_speed := 6.0
@export var sprint_speed := 10.5
@export var accel := 14.0
@export var gravity := 24.0
@export var dodge_speed := 13.0
@export var dodge_duration := 0.28
@export var dodge_cooldown := 0.55
@export var max_health := 120.0
@export var max_posture := 100.0

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

	if stagger_timer > 0.0:
		velocity = velocity.lerp(Vector3.ZERO, minf(1.0, 8.0 * delta))
		_ground_snap()
		return

	if dodge_timer > 0.0:
		velocity = dodge_dir * dodge_speed
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
	rotation.y = lerp_angle(rotation.y, yaw, minf(1.0, 12.0 * delta))
	_ground_snap()

	# Posture recovery
	posture = minf(max_posture, posture + (6.0 if guarding else 11.0) * delta * 0.1)

func _tick_timers(delta: float) -> void:
	guard_timer += delta
	dodge_timer = maxf(dodge_timer - delta, 0.0)
	dodge_cooldown = maxf(dodge_cooldown - delta, 0.0)
	invuln_timer = maxf(invuln_timer - delta, 0.0)
	stagger_timer = maxf(stagger_timer - delta, 0.0)

func _ground_snap() -> void:
	move_and_slide()
	var terrain := get_parent().get_node_or_null("Terrain")
	if terrain != null and terrain.has_method("sample_height"):
		var h: float = terrain.sample_height(global_position.x, global_position.z)
		global_position.y = h + 0.9

func try_attack() -> void:
	if slash_area == null or stagger_timer > 0.0:
		return
	var hit := false
	for body in slash_area.get_overlapping_bodies():
		if body.is_in_group("enemy") and body.has_method("take_damage"):
			body.take_damage(26.0)
			hit = true
	if hit and body_mesh != null:
		body_mesh.scale = Vector3(1.12, 0.92, 1.12)
		await get_tree().create_timer(0.08).timeout
		if body_mesh != null:
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
	health_changed.emit(health, max_health)
	posture_changed.emit(posture, max_posture)
