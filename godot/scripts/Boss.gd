extends CharacterBody3D
class_name KotodamaBoss

## Mini-boss: The Drowned General (KOTODAMA) — v2.
## Phase 1: slow chases + wide slashes. Phase 2 (<50% HP): faster, gold/red
## telegraphs, entry shockwave + enrage pulse. Emits intro_started on first
## aggro so Game can play the cinematic beat.

signal died(boss: KotodamaBoss)
signal intro_started(boss: KotodamaBoss)

@export var max_hp := 420.0
@export var max_posture := 140.0
@export var move_speed := 2.8
@export var detect_range := 22.0
@export var attack_range := 2.4
@export var attack_damage := 20.0

var hp := max_hp
var posture := max_posture
var phase := 1
var player: Node3D
var aggro := false
var attack_cooldown := 0.0
var telegraph_timer := 0.0
var lunging := false
var dead := false
var thrust_mode := false
var intro_done := false
var enrage_phase := 0.0
var shockwave: MeshInstance3D

@onready var body_mesh: MeshInstance3D = get_node_or_null("BodyMesh") as MeshInstance3D

func _ready() -> void:
	add_to_group("enemy")
	player = get_tree().get_first_node_in_group("player")

func is_defeated() -> bool:
	return dead

func get_posture() -> float:
	return posture

func _physics_process(delta: float) -> void:
	if dead:
		return
	attack_cooldown = maxf(attack_cooldown - delta, 0.0)
	telegraph_timer = maxf(telegraph_timer - delta, 0.0)
	if player == null:
		return

	if phase == 2:
		enrage_phase += delta
		if body_mesh != null:
			var m: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
			m.emission = Color(0.9, 0.25, 0.12)
			m.emission_energy = 1.2 + sin(enrage_phase * 6.0) * 0.8

	var to_player := player.global_position - global_position
	to_player.y = 0.0
	var dist := to_player.length()

	if not aggro:
		if dist < detect_range:
			aggro = true
			if not intro_done:
				intro_done = true
				intro_started.emit(self)
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
	if phase == 1:
		m.emission_energy = 0.0
	# phase 2 keeps its enrage pulse from _physics_process

func _resolve_attack() -> void:
	if player.has_method("take_damage"):
		player.take_damage(attack_damage)
	lunging = false

func take_damage(amount: float, posture_dmg := 18.0) -> void:
	if dead:
		return
	hp -= amount
	posture = maxf(posture - posture_dmg, 0.0)
	aggro = true
	if hp <= max_hp * 0.5 and phase == 1:
		_enter_phase_two()
	if body_mesh != null and phase == 1:
		var m: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
		m.emission = Color(1.0, 0.35, 0.2)
		m.emission_energy = 3.0
		await get_tree().create_timer(0.12).timeout
		if is_instance_valid(body_mesh):
			var m2: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
			m2.emission_energy = 0.0
	if hp <= 0.0:
		dead = true
		_die()
		died.emit(self)

func _enter_phase_two() -> void:
	phase = 2
	move_speed *= 1.3
	posture = max_posture
	_spawn_shockwave(Color(1.0, 0.4, 0.15))
	if body_mesh != null:
		var m: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
		m.emission = Color(1.0, 0.3, 0.12)
		m.emission_energy = 3.5
		await get_tree().create_timer(0.35).timeout
		if is_instance_valid(body_mesh):
			var m2: StandardMaterial3D = body_mesh.mesh.surface_get_material(0)
			m2.emission_energy = 1.2

func _spawn_shockwave(color: Color) -> void:
	var ring := MeshInstance3D.new()
	ring.name = "Shockwave"
	var plane := PlaneMesh.new()
	plane.size = Vector2(1.0, 1.0)
	ring.mesh = plane
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.emission = color
	mat.emission_energy = 2.6
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.no_depth_test = true
	ring.material_override = mat
	ring.position = global_position + Vector3(0.0, 0.15, 0.0)
	ring.rotation_degrees = Vector3(-90.0, 0.0, 0.0)
	get_parent().add_child(ring)
	var tw := create_tween()
	tw.tween_property(ring, "scale", Vector3(14.0, 1.0, 14.0), 0.6)
	tw.parallel().tween_property(mat, "albedo_color:a", 0.0, 0.6)
	tw.tween_callback(ring.queue_free)

func _die() -> void:
	set_physics_process(false)
	_spawn_shockwave(Color(0.8, 0.9, 1.0))
	var tw := create_tween()
	if body_mesh != null:
		tw.tween_property(body_mesh, "scale", Vector3(1.4, 0.02, 1.4), 0.9)
		tw.parallel().tween_property(body_mesh, "position:y", body_mesh.position.y + 0.6, 0.9)
	tw.tween_callback(hide)

func _ground_snap() -> void:
	move_and_slide()
	var terrain := get_parent().get_node_or_null("Terrain")
	if terrain != null and terrain.has_method("sample_height"):
		var h: float = terrain.sample_height(global_position.x, global_position.z)
		global_position.y = h + 1.15
