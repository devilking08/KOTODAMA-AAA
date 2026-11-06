extends SceneTree

func _initialize() -> void:
	var scene: PackedScene = load("res://scenes/main.tscn")
	var inst := scene.instantiate()
	root.add_child(inst)
	await create_timer(1.0).timeout
	for child in inst.get_children():
		var res: Script = child.get_script()
		var script_path: String = res.resource_path if res != null else "<none>"
		print("PROBE node=", child.name, " type=", child.get_class(), " script=", script_path)
	quit(0)
