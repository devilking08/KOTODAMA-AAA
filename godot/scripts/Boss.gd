extends CharacterBody3D
class_name KotodamaBoss

## Mini-boss: The Drowned General.
## Phase 1: slow chases + wide slashes. Phase 2 (<50% HP): faster, telegraphs
## gold (sweep) with a lunge, and uses a red unblockable thrust.

signal died(boss: KotodamaBoss)

@export var max_hp := 420.0
@export var move_speed := 2.8
@export var detect_range := 22.0
@export var attack_range := 2.4
@export var attack_damage := 20.0

var hp := max_hp
var phase := 1
var player: Node3D
var aggro := false
var attack_cooldown := 0.0
var telegraph_timer := 0.0
var lunging := false
var dead := false
var thrust_mode := false

@onready var body_mesh: MeshInstance3D = get_node_or_null("BodyMesh") as MeshInstance3D

func _ready() -> void:
	add_to_group("enemy")
	player = get_tree().get_first_node_in_group("player")

func _physics_process(delta: float) -> void:
	if dead:
		return
	attack_cooldown = maxf(attack_cooldown - delta, 0.0)
	telegraph_timer = maxf(telegraph_timer - delta, 0.0)
	if player == null:
		return

	var to_player := player.global_position - global_position
	to_player.y = 0.0
	var dist := to_player.length()

	if not aggro:
		if dist < detect_range:
			aggro = true
		else:
			_ground_snap()
			return

	if telegraph_timer > 0.0:
		_telegraph_flash()
		velocity = Vector3.ZERO
		_ground_snap()
		return

	_reset_flash()

	if lunging:
		velocity = to_player.normalized() * move_speed * (3.2 if thrust_mode else 2.4)
		_ground_snap()
		if dist < attack_range:
			_resolve_attack()
		return

	if dist > attack_range:
		velocity = to_player.normalized() * move_speed * (1.3 if phase == 2 else 1.0)
		rotation.y = lerp_angle(rotation.y, atan2(to_player.x, to_player.z), minf(1.0, 6.0 * delta))
	elif attack_cooldown <= 0.0:
		thrust_mode = phase == 2 and randf() < 0.35
		telegraph_timer = 0.55
		lunging = true
		attack_cooldown = 2.2 if phase == 1 else 1.5
		velocity = Vector3.ZERO
	else:
		velocity = Vector3.ZERO

	_ground_snap()

func _telegraph_flash() -> void:
	if body_mesh == null:
		return
	var m: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
	m.emission = Color(1.0, 0.75, 0.25) if not thrust_mode else Color(1.0, 0.2, 0.1)
	m.emission_energy = 2.5 + sin(Time.get_ticks_msec() * 0.03) * 1.5

func _reset_flash() -> void:
	if body_mesh == null:
		return
	var m: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
	m.emission_energy = 0.0

func _resolve_attack() -> void:
	if player.has_method("take_damage"):
		player.take_damage(attack_damage)
	lunging = false

func _ground_snap() -> void:
	move_and_slide()
	var terrain := get_parent().get_node_or_null("Terrain")
	if terrain != null and terrain.has_method("sample_height"):
		var h: float = terrain.sample_height(global_position.x, global_position.z)
		global_position.y = h + 1.15

func take_damage(amount: float) -> void:
	if dead:
		return
	hp -= amount
	aggro = true
	if hp <= max_hp * 0.5 and phase == 1:
		phase = 2
		move_speed *= 1.3
	if body_mesh != null:
		var m: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
		m.emission = Color(1.0, 0.35, 0.2)
		m.emission_energy = 3.0
		await get_tree().create_timer(0.12).timeout
		if is_instance_valid(body_mesh):
			var m2: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
			m2.emission_energy = 0.0
	if hp <= 0.0:
		dead = true
		hide()
		set_physics_process(false)
		died.emit(self)
