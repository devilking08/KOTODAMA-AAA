extends Node

## Deterministic procedural terrain.
## The collision surface is analytic (sample_height), so the player never
## floats even where the mesh is coarse.

class_name KotodamaTerrain

const SIZE := 360.0
const SEGMENTS := 96
const STEP := SIZE / float(SEGMENTS)

var mesh_instance: MeshInstance3D
var noise: FastNoiseLite

func _ready() -> void:
	noise = FastNoiseLite.new()
	noise.noise_type = FastNoiseLite.TYPE_SIMPLEX
	noise.seed = 101
	noise.frequency = 0.0065
	noise.fractal_octaves = 5
	noise.fractal_gain = 0.5
	_build_mesh()

func sample_height(x: float, z: float) -> float:
	# Rolling coast: high at the north ridge, falling toward the south.
	var n := noise.get_noise_2d(x, z) * 18.0
	var ridge := clampf((z + SIZE * 0.5) / SIZE, 0.0, 1.0)
	return 6.0 + n + ridge * 22.0

func _build_mesh() -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)

	var verts := PackedVector3Array()
	var colors := PackedColorArray()
	var indices := PackedInt32Array()

	for j in range(SEGMENTS + 1):
		for i in range(SEGMENTS + 1):
			var x := -SIZE * 0.5 + float(i) * STEP
			var z := -SIZE * 0.5 + float(j) * STEP
			var h := sample_height(x, z)
			verts.append(Vector3(x, h, z))
			var t := clampf((h + 8.0) / 40.0, 0.0, 1.0)
			colors.append(Color(0.42, 0.36, 0.24).lerp(Color(0.62, 0.52, 0.30), t))

	for j in range(SEGMENTS):
		for i in range(SEGMENTS):
			var a := j * (SEGMENTS + 1) + i
			var b := a + 1
			var c := a + SEGMENTS + 1
			var d := c + 1
			indices.append(a); indices.append(c); indices.append(b)
			indices.append(b); indices.append(c); indices.append(d)

	for k in indices:
		st.set_color(colors[k])
		st.add_vertex(verts[k])

	st.generate_normals()
	var mesh := st.commit()

	var mat := StandardMaterial3D.new()
	mat.vertex_color_use_as_albedo = true
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.roughness = 1.0
	mat.vertex_color_is_srgb = true
	mesh.surface_set_material(0, mat)

	mesh_instance = MeshInstance3D.new()
	mesh_instance.mesh = mesh
	add_child(mesh_instance)
