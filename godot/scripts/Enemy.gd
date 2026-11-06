extends CharacterBody3D
class_name KotodamaEnemy

## Grunt enemy (KOTODAMA) — v2 feel pass.
## Health + posture split; telegraph flash (gold = melee, red = unblockable);
## posture break -> stagger (riposte window); idle motion; defeat state.

signal defeated(enemy: Node3D)

@export var max_hp := 70.0
@export var max_posture := 60.0
@export var move_speed := 3.6
@export var detect_range := 16.0
@export var attack_range := 1.9
@export var attack_damage := 12.0
@export var attack_cd_time := 1.6
@export var posture_break_time := 2.2

var hp := max_hp
var posture := max_posture
var player: Node3D
var aggro := false
var attack_cooldown := 0.0
var telegraph_timer := 0.0
var lunging := false
var defeated := false
var stagger_timer := 0.0
var telegraph_red := false
var idle_phase := 0.0

@onready var body_mesh: MeshInstance3D = get_node_or_null("BodyMesh") as MeshInstance3D

func _ready() -> void:
	add_to_group("enemy")
	player = get_tree().get_first_node_in_group("player")

func is_defeated() -> bool:
	return defeated

func get_posture() -> float:
	return posture

func _physics_process(delta: float) -> void:
	if defeated:
		return
	attack_cooldown = maxf(attack_cooldown - delta, 0.0)
	telegraph_timer = maxf(telegraph_timer - delta, 0.0)
	idle_phase += delta

	if stagger_timer > 0.0:
		stagger_timer = maxf(stagger_timer - delta, 0.0)
		velocity = Vector3.ZERO
		_ground_snap()
		return

	if player == null:
		return

	var to_player := player.global_position - global_position
	to_player.y = 0.0
	var dist := to_player.length()

	if not aggro:
		if dist < detect_range:
			aggro = true
		else:
			# idle sway while waiting
			if body_mesh != null:
				body_mesh.rotation_degrees.z = sin(idle_phase * 2.0) * 1.5
			_ground_snap()
			return

	if telegraph_timer > 0.0:
		_telegraph_flash()
		velocity = Vector3.ZERO
		_ground_snap()
		return

	_reset_flash()

	if lunging:
		velocity = to_player.normalized() * move_speed * (2.6 if telegraph_red else 2.1)
		_ground_snap()
		if dist < attack_range:
			_resolve_attack()
		return

	if dist > attack_range:
		velocity = to_player.normalized() * move_speed
		rotation.y = lerp_angle(rotation.y, atan2(to_player.x, to_player.z), minf(1.0, 6.0 * delta))
	elif attack_cooldown <= 0.0:
		telegraph_red = randf() < 0.18
		telegraph_timer = 0.45
		lunging = true
		attack_cooldown = attack_cd_time
		velocity = Vector3.ZERO
	else:
		velocity = Vector3.ZERO

	_ground_snap()

func _telegraph_flash() -> void:
	if body_mesh == null:
		return
	var m: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
	if telegraph_red:
		m.emission = Color(1.0, 0.2, 0.1)
	else:
		m.emission = Color(1.0, 0.75, 0.25)
	m.emission_energy = 2.5 + sin(Time.get_ticks_msec() * 0.03) * 1.5

func _reset_flash() -> void:
	if body_mesh == null:
		return
	var m: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
	m.emission_energy = 0.0

func _resolve_attack() -> void:
	if player != null and player.has_method("take_damage"):
		player.take_damage(attack_damage)
	lunging = false

func take_damage(amount: float, posture_dmg := 10.0) -> void:
	if defeated:
		return
	hp -= amount
	posture = maxf(posture - posture_dmg, 0.0)
	aggro = true
	if body_mesh != null:
		var m: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
		m.emission = Color(1.0, 0.9, 0.7)
		m.emission_energy = 2.0
		await get_tree().create_timer(0.08).timeout
		if is_instance_valid(body_mesh):
			var m2: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
			m2.emission_energy = 0.0
	if posture <= 0.0 and not defeated:
		stagger_timer = posture_break_time
		posture = max_posture
	if hp <= 0.0:
		defeated = true
		_dissolve()
		defeated.emit(self)

func _dissolve() -> void:
	set_physics_process(false)
	if body_mesh == null:
		queue_free()
		return
	var m: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
	m.emission = Color(0.9, 0.95, 1.0)
	m.emission_energy = 3.0
	var tw := create_tween()
	tw.tween_property(body_mesh, "scale", Vector3(0.08, 0.08, 0.08), 0.45)
	tw.parallel().tween_property(body_mesh, "position:y", body_mesh.position.y + 1.2, 0.45)
	tw.tween_callback(queue_free)

func _ground_snap() -> void:
	move_and_slide()
	var terrain := get_parent().get_node_or_null("Terrain")
	if terrain != null and terrain.has_method("sample_height"):
		var h: float = terrain.sample_height(global_position.x, global_position.z)
		global_position.y = h + 1.05
