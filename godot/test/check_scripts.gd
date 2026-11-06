extends SceneTree

## Gate: every .gd under res://scripts must load (compile) cleanly.
## Catches parse/type errors that --check-only misses and that a failing
## load() in the scene builder would otherwise silently degrade (set_script
## on null -> script-less node -> group missing at runtime).

func _initialize() -> void:
	var dir := DirAccess.open("res://scripts")
	if dir == null:
		print("SCRIPTCHECK cannot_open_res_scripts")
		quit(1)
		return
	var failed: Array[String] = []
	dir.list_dir_begin()
	var f := dir.get_next()
	while f != "":
		if f.ends_with(".gd"):
			var s: Script = load("res://scripts/" + f)
			if s == null:
				failed.append(f)
		f = dir.get_next()
	dir.list_dir_end()
	if failed.size() > 0:
		print("SCRIPTCHECK failed=", failed)
		quit(1)
	else:
		print("SCRIPTCHECK all_scripts_loadable")
		quit(0)
