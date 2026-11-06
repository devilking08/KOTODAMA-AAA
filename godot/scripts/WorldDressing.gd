extends Node

## World dressing: simple props (torii, lanterns, shrine marker) and a
## shimmering water plane near the spawn. Pure cheap geometry, no shadows.

const TORII_MAT := Color(0.66, 0.23, 0.17)
const LANTERN_GLOW := Color(1.0, 0.7, 0.35)

func _ready() -> void:
	_add_torii(Vector3(0.0, 0.0, 30.0))
	_add_lantern(Vector3(4.0, 0.0, 33.0))
	_add_lantern(Vector3(-4.0, 0.0, 33.0))
	_add_water(Vector3(0.0, 0.0, -90.0), Vector3(260.0, 1.0, 160.0))

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
	glow_mat.emission_energy = 2.0
	glow.material_override = glow_mat
	glow.position = at + Vector3(0.0, 2.7, 0.0)
	add_child(glow)

func _add_water(at: Vector3, size: Vector3) -> void:
	var water := MeshInstance3D.new()
	water.name = "Water"
	var plane := PlaneMesh.new()
	plane.size = Vector2(size.x, size.z)
	water.mesh = plane
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.12, 0.3, 0.38, 0.75)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.metallic = 0.1
	mat.roughness = 0.2
	water.material_override = mat
	water.position = at
	water.rotation_degrees = Vector3(-90.0, 0.0, 0.0)
	add_child(water)
