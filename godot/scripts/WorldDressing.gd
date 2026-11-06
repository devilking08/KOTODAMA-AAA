extends Node

## World dressing (KOTODAMA) — v2: torii, flickering lanterns, shimmering
## water with shoreline foam, and a CPU-safe ember particle system.
## Non-GPU budget: no shadows, no glow, ≤1 particle emitter, ≤40 particles.

const TORII_MAT := Color(0.66, 0.23, 0.17)
const LANTERN_GLOW := Color(1.0, 0.7, 0.35)

var lanterns: Array[Dictionary] = []
var water_mat: StandardMaterial3D
var foam_mat: StandardMaterial3D
var time_elapsed := 0.0

func _ready() -> void:
	_add_torii(Vector3(0.0, 0.0, 30.0))
	_add_lantern(Vector3(4.0, 0.0, 33.0))
	_add_lantern(Vector3(-4.0, 0.0, 33.0))
	_add_water(Vector3(0.0, 0.0, -90.0), Vector3(260.0, 1.0, 160.0))
	_add_foam(Vector3(0.0, 0.0, -26.0))
	_add_embers()

func _process(delta: float) -> void:
	time_elapsed += delta
	var t := time_elapsed
	# Lantern flicker: emission energy breathes with per-lantern phase.
	for l in lanterns:
		var mat: StandardMaterial3D = l["mat"]
		var phase: float = l["phase"]
		var flicker := 1.6 + sin(t * 7.0 + phase) * 0.45 + sin(t * 13.0 + phase * 2.1) * 0.2
		mat.emission_energy = maxf(flicker, 0.8)
	# Water shimmer: subtle alpha + emissive sheen breathing.
	if water_mat != null:
		water_mat.albedo_color.a = 0.72 + sin(t * 1.2) * 0.04
		water_mat.emission_energy = 0.15 + sin(t * 0.8) * 0.08
	if foam_mat != null:
		foam_mat.albedo_color.a = 0.30 + sin(t * 0.9) * 0.06

func _add_torii(at: Vector3) -> void:
	var group := Node3D.new()
	group.name = "Torii"
	group.position = at
	var pillar_mat := StandardMaterial3D.new()
	pillar_mat.albedo_color = TORII_MAT
	pillar_mat.roughness = 0.6
	for side in [-2.0, 2.0]:
		var pillar := MeshInstance3D.new()
		var cyl := CylinderMesh.new()
		cyl.top_radius = 0.22
		cyl.bottom_radius = 0.3
		cyl.height = 6.0
		pillar.mesh = cyl
		pillar.material_override = pillar_mat
		pillar.position = Vector3(side, 3.0, 0.0)
		group.add_child(pillar)
	var beam := MeshInstance3D.new()
	var beam_mesh := BoxMesh.new()
	beam_mesh.size = Vector3(5.4, 0.5, 0.5)
	beam.mesh = beam_mesh
	beam.material_override = pillar_mat
	beam.position = Vector3(0.0, 6.2, 0.0)
	group.add_child(beam)
	add_child(group)

func _add_lantern(at: Vector3) -> void:
	var pole := MeshInstance3D.new()
	var pole_mesh := CylinderMesh.new()
	pole_mesh.top_radius = 0.05
	pole_mesh.bottom_radius = 0.08
	pole_mesh.height = 2.6
	pole.mesh = pole_mesh
	var dark := StandardMaterial3D.new()
	dark.albedo_color = Color(0.15, 0.12, 0.1)
	pole.material_override = dark
	pole.position = at + Vector3(0.0, 1.3, 0.0)
	add_child(pole)
	var glow := MeshInstance3D.new()
	var glow_mesh := SphereMesh.new()
	glow_mesh.radius = 0.3
	glow_mesh.height = 0.5
	glow.mesh = glow_mesh
	var glow_mat := StandardMaterial3D.new()
	glow_mat.albedo_color = LANTERN_GLOW
	glow_mat.emission = LANTERN_GLOW
	glow_mat.emission_energy = 1.8
	glow.material_override = glow_mat
	glow.position = at + Vector3(0.0, 2.7, 0.0)
	add_child(glow)
	lanterns.append({"mat": glow_mat, "phase": randf() * TAU})

func _add_water(at: Vector3, size: Vector3) -> void:
	var water := MeshInstance3D.new()
	water.name = "Water"
	var plane := PlaneMesh.new()
	plane.size = Vector2(size.x, size.z)
	water.mesh = plane
	water_mat = StandardMaterial3D.new()
	water_mat.albedo_color = Color(0.12, 0.3, 0.38, 0.72)
	water_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	water_mat.metallic = 0.1
	water_mat.roughness = 0.2
	water_mat.emission = Color(0.1, 0.25, 0.32)
	water_mat.emission_energy = 0.2
	water.material_override = water_mat
	water.position = at
	water.rotation_degrees = Vector3(-90.0, 0.0, 0.0)
	add_child(water)

func _add_foam(at: Vector3) -> void:
	var foam := MeshInstance3D.new()
	foam.name = "Foam"
	var plane := PlaneMesh.new()
	plane.size = Vector2(120.0, 14.0)
	foam.mesh = plane
	foam_mat = StandardMaterial3D.new()
	foam_mat.albedo_color = Color(0.85, 0.9, 0.92, 0.3)
	foam_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	foam_mat.roughness = 1.0
	foam.material_override = foam_mat
	foam.position = at
	foam.rotation_degrees = Vector3(-90.0, 0.0, 0.0)
	add_child(foam)

func _add_embers() -> void:
	var embers := CPUParticles3D.new()
	embers.name = "Embers"
	embers.amount = 36
	embers.lifetime = 4.0
	embers.one_shot = false
	embers.explosiveness = 0.0
	embers.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	embers.emission_sphere_radius = 10.0
	embers.direction = Vector3(0.0, 1.0, 0.0)
	embers.spread = 12.0
	embers.gravity = Vector3(0.0, -0.3, 0.0)
	embers.initial_velocity_min = 0.4
	embers.initial_velocity_max = 1.1
	embers.scale_amount_min = 0.04
	embers.scale_amount_max = 0.12
	embers.color = Color(1.0, 0.62, 0.3, 0.8)
	embers.visibility_aabb = AABB(Vector3(-18.0, 0.0, -18.0), Vector3(36.0, 12.0, 36.0))
	embers.position = Vector3(0.0, 1.2, 4.0)
	add_child(embers)
