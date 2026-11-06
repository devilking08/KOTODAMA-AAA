extends CharacterBody3D
class_name KotodamaEnemy

## Grunt AI: patrol/chase toward the player, telegraph a strike with a
## bright flash, then lunge. Readable, minimal, cheap.

signal died(enemy: KotodamaEnemy)

@export var hp := 40.0
@export var move_speed := 3.4
@export var attack_range := 1.8
@export var attack_damage := 12.0
@export var detect_range := 16.0

var player: Node3D
var aggro := false
var attack_cooldown := 0.0
var telegraph_timer := 0.0
var lunging := false
var dead := false

@onready var body_mesh: MeshInstance3D = get_node_or_null("BodyMesh") as MeshInstance3D

func _ready() -> void:
	player = get_tree().get_first_node_in_group("player")
	add_to_group("enemy")

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
		# Telegraph: bright emissive pulse, hold still.
		if body_mesh != null:
			var m: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
			m.emission_energy = 2.0 + sin(Time.get_ticks_msec() * 0.03) * 1.5
		velocity = Vector3.ZERO
		_ground_snap()
		return

	if body_mesh != null:
		var m2: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
		m2.emission_energy = 0.0

	if lunging:
		# Commit: close the gap fast, then resolve the hit.
		velocity = to_player.normalized() * move_speed * 2.6
		_ground_snap()
		if dist < attack_range:
			_resolve_attack(delta)
		return

	if dist > attack_range:
		velocity = to_player.normalized() * move_speed
		rotation.y = lerp_angle(rotation.y, atan2(to_player.x, to_player.z), minf(1.0, 6.0 * delta))
	elif attack_cooldown <= 0.0:
		telegraph_timer = 0.45
		lunging = true
		attack_cooldown = 1.8
		velocity = Vector3.ZERO
	else:
		velocity = Vector3.ZERO

	_ground_snap()

func _resolve_attack(_delta: float) -> void:
	if player.has_method("take_damage"):
		player.take_damage(attack_damage)
	lunging = false

func _ground_snap() -> void:
	move_and_slide()
	var terrain := get_parent().get_node_or_null("Terrain")
	if terrain != null and terrain.has_method("sample_height"):
		var h: float = terrain.sample_height(global_position.x, global_position.z)
		global_position.y = h + 0.9

func take_damage(amount: float) -> void:
	if dead:
		return
	hp -= amount
	aggro = true
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
