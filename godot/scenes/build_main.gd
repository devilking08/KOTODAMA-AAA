extends SceneTree

## Builds res://scenes/main.tscn headlessly.
## Run: godot --headless --script scenes/build_main.gd
## Pure construction — no runtime logic, no signals, no awaits.

const MAIN_PATH := "res://scenes/main.tscn"

func _initialize() -> void:
	var root := Node.new()
	root.name = "Main"

	# ── Game root (orchestrator) ───────────────────────────────────────
	var game := Node.new()
	game.name = "Game"
	game.set_script(load("res://scripts/Game.gd"))
	root.add_child(game)

	# ── Terrain ────────────────────────────────────────────────────────
	var terrain := Node.new()
	terrain.name = "Terrain"
	terrain.set_script(load("res://scripts/Terrain.gd"))
	root.add_child(terrain)

	# ── Environment + lighting (low-spec) ───────────────────────────────
	var env := WorldEnvironment.new()
	env.name = "WorldEnvironment"
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color(0.08, 0.07, 0.05)
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	environment.fog_enabled = true
	environment.fog_light_color = Color(0.85, 0.65, 0.40)
	environment.fog_density = 0.012
	env.environment = environment
	root.add_child(env)

	var sun := DirectionalLight3D.new()
	sun.name = "Sun"
	sun.rotation_degrees = Vector3(-52.0, -35.0, 0.0)
	sun.light_energy = 1.2
	sun.shadow_enabled = false
	root.add_child(sun)

	var fill := DirectionalLight3D.new()
	fill.name = "Fill"
	fill.rotation_degrees = Vector3(10.0, 130.0, 0.0)
	fill.light_color = Color(0.55, 0.70, 0.95)
	fill.light_energy = 0.35
	fill.shadow_enabled = false
	root.add_child(fill)

	# ── Player ──────────────────────────────────────────────────────────
	var player := CharacterBody3D.new()
	player.name = "Player"
	player.set_script(load("res://scripts/Player.gd"))
	player.position = Vector3(0.0, 0.0, 40.0)

	var player_collision := CollisionShape3D.new()
	player_collision.name = "Collision"
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.45
	capsule.height = 1.8
	player_collision.shape = capsule
	player.add_child(player_collision)

	var body_mesh := MeshInstance3D.new()
	body_mesh.name = "BodyMesh"
	var box := BoxMesh.new()
	box.size = Vector3(0.7, 1.6, 0.5)
	var cloth := StandardMaterial3D.new()
	cloth.albedo_color = Color(0.16, 0.13, 0.10)
	cloth.roughness = 0.9
	box.material = cloth
	body_mesh.mesh = box
	body_mesh.position = Vector3(0.0, 0.9, 0.0)
	player.add_child(body_mesh)

	var slash_area := Area3D.new()
	slash_area.name = "SlashArea"
	slash_area.position = Vector3(0.0, 0.9, -1.1)
	var slash_shape := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = 1.35
	slash_shape.shape = sphere
	slash_area.add_child(slash_shape)
	player.add_child(slash_area)

	var pivot := Node3D.new()
	pivot.name = "CameraPivot"
	var camera := Camera3D.new()
	camera.name = "Camera"
	camera.current = true
	camera.fov = 66.0
	camera.position = Vector3(0.0, 1.8, 4.2)
	pivot.add_child(camera)
	player.add_child(pivot)

	root.add_child(player)

	# ── Enemies (two grunts) ────────────────────────────────────────────
	for i in 2:
		var enemy := CharacterBody3D.new()
		enemy.name = "Enemy%d" % i
		enemy.set_script(load("res://scripts/Enemy.gd"))
		enemy.position = Vector3(-6.0 + float(i) * 12.0, 0.0, 14.0)

		var enemy_collision := CollisionShape3D.new()
		var enemy_sphere := SphereShape3D.new()
		enemy_sphere.radius = 0.55
		enemy_collision.shape = enemy_sphere
		enemy.add_child(enemy_collision)

		var enemy_mesh := MeshInstance3D.new()
		enemy_mesh.name = "BodyMesh"
		var robe := BoxMesh.new()
		robe.size = Vector3(0.8, 1.7, 0.6)
		var robe_mat := StandardMaterial3D.new()
		robe_mat.albedo_color = Color(0.28, 0.12, 0.10)
		robe_mat.roughness = 0.85
		robe.material = robe_mat
		enemy_mesh.mesh = robe
		enemy_mesh.position = Vector3(0.0, 0.95, 0.0)
		enemy.add_child(enemy_mesh)

		root.add_child(enemy)

	# ── HUD ─────────────────────────────────────────────────────────────
	var hud := CanvasLayer.new()
	hud.name = "HUD"
	hud.set_script(load("res://scripts/HUD.gd"))

	var control := Control.new()
	control.name = "Control"
	control.set_anchors_preset(Control.PRESET_TOP_LEFT)
	control.position = Vector2(24.0, 24.0)
	control.size = Vector2(420.0, 120.0)
	hud.add_child(control)

	var health_bar := ProgressBar.new()
	health_bar.name = "HealthBar"
	health_bar.position = Vector2(0.0, 0.0)
	health_bar.size = Vector2(360.0, 22.0)
	health_bar.max_value = 120.0
	health_bar.value = 120.0
	control.add_child(health_bar)

	var health_label := Label.new()
	health_label.name = "HealthLabel"
	health_label.position = Vector2(0.0, 26.0)
	health_label.text = "VITALITY 120/120"
	control.add_child(health_label)

	var posture_bar := ProgressBar.new()
	posture_bar.name = "PostureBar"
	posture_bar.position = Vector2(0.0, 52.0)
	posture_bar.size = Vector2(360.0, 16.0)
	posture_bar.max_value = 100.0
	posture_bar.value = 100.0
	control.add_child(posture_bar)

	var posture_label := Label.new()
	posture_label.name = "PostureLabel"
	posture_label.position = Vector2(0.0, 74.0)
	posture_label.text = "POSTURE 100/100"
	control.add_child(posture_label)

	var objective_label := Label.new()
	objective_label.name = "ObjectiveLabel"
	objective_label.position = Vector2(0.0, 98.0)
	objective_label.text = ""
	objective_label.add_theme_font_size_override("font_size", 14)
	control.add_child(objective_label)

	root.add_child(hud)

	# ── Boss (mini-boss: The Drowned General) ────────────────────────────
	var boss := CharacterBody3D.new()
	boss.name = "Boss"
	boss.set_script(load("res://scripts/Boss.gd"))
	boss.position = Vector3(0.0, 0.0, -70.0)

	var boss_collision := CollisionShape3D.new()
	var boss_sphere := SphereShape3D.new()
	boss_sphere.radius = 0.9
	boss_collision.shape = boss_sphere
	boss.add_child(boss_collision)

	var boss_mesh := MeshInstance3D.new()
	boss_mesh.name = "BodyMesh"
	var boss_robe := BoxMesh.new()
	boss_robe.size = Vector3(1.3, 2.6, 0.9)
	var boss_mat := StandardMaterial3D.new()
	boss_mat.albedo_color = Color(0.12, 0.2, 0.28)
	boss_mat.roughness = 0.8
	boss_robe.material = boss_mat
	boss_mesh.mesh = boss_robe
	boss_mesh.position = Vector3(0.0, 1.45, 0.0)
	boss.add_child(boss_mesh)

	root.add_child(boss)

	# ── World dressing (torii, lanterns, water) ───────────────────────────
	var dressing := Node.new()
	dressing.name = "WorldDressing"
	dressing.set_script(load("res://scripts/WorldDressing.gd"))
	root.add_child(dressing)

	# ── Dialogue UI ───────────────────────────────────────────────────────
	var dialogue_ui := CanvasLayer.new()
	dialogue_ui.name = "DialogueUI"
	dialogue_ui.set_script(load("res://scripts/DialogueUI.gd"))

	var dlg_control := Control.new()
	dlg_control.name = "Control"
	dlg_control.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	dlg_control.position = Vector2(-330.0, -140.0)
	dlg_control.size = Vector2(660.0, 120.0)
	dialogue_ui.add_child(dlg_control)

	var speaker_label := Label.new()
	speaker_label.name = "SpeakerLabel"
	speaker_label.position = Vector2(0.0, 0.0)
	speaker_label.text = ""
	speaker_label.add_theme_font_size_override("font_size", 16)
	dlg_control.add_child(speaker_label)

	var text_label := Label.new()
	text_label.name = "TextLabel"
	text_label.position = Vector2(0.0, 26.0)
	text_label.text = ""
	text_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	text_label.size = Vector2(660.0, 80.0)
	text_label.add_theme_font_size_override("font_size", 18)
	dlg_control.add_child(text_label)

	root.add_child(dialogue_ui)

	set_owner_recursive(root, root)
	var expected := count_nodes(root)
	var packed := PackedScene.new()
	if packed.pack(root) != OK:
		push_error("pack failed")
		quit(1)
		return
	var probe := packed.instantiate()
	var got := count_nodes(probe)
	probe.free()
	if got != expected:
		push_error("node count mismatch %d != %d" % [got, expected])
		quit(1)
		return
	ResourceSaver.save(packed, MAIN_PATH)
	print("saved ", MAIN_PATH)
	quit(0)

func set_owner_recursive(node: Node, owner_node: Node) -> void:
	for child in node.get_children():
		child.owner = owner_node
		set_owner_recursive(child, owner_node)

func count_nodes(node: Node) -> int:
	var n := 1
	for child in node.get_children():
		n += count_nodes(child)
	return n
