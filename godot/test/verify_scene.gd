extends SceneTree

## Gate 5: scene integrity verification.
## Instantiates main.tscn and asserts every authored node has its script
## attached. Exits 1 on any mismatch — this catches silent script-load
## failures (e.g. a parse error in one script cascading into another via
## class_name references) that pack() would otherwise serialize away.

const EXPECTED := {
	"Game": "res://scripts/Game.gd",
	"Terrain": "res://scripts/Terrain.gd",
	"Player": "res://scripts/Player.gd",
	"Enemy0": "res://scripts/Enemy.gd",
	"Enemy1": "res://scripts/Enemy.gd",
	"HUD": "res://scripts/HUD.gd",
	"Boss": "res://scripts/Boss.gd",
	"WorldDressing": "res://scripts/WorldDressing.gd",
	"DialogueUI": "res://scripts/DialogueUI.gd",
}

func _initialize() -> void:
	var scene: PackedScene = load("res://scenes/main.tscn")
	var inst := scene.instantiate()
	root.add_child(inst)
	await create_timer(1.0).timeout

	var failed := false
	for node_name: String in EXPECTED:
		var node := inst.get_node_or_null(node_name)
		if node == null:
			print("VERIFY missing_node=", node_name)
			failed = true
			continue
		var res: Script = node.get_script()
		var actual: String = res.resource_path if res != null else "<none>"
		var want: String = EXPECTED[node_name]
		if actual != want:
			print("VERIFY script_mismatch node=", node_name, " want=", want, " got=", actual)
			failed = true
	print("VERIFY scripts=", inst.get_children().size(), " ok=", not failed)
	quit(1 if failed else 0)
