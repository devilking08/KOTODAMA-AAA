extends Object
class_name KotodamaSave

## Minimal durable save: position, health, flags. JSON in user://.

const PATH := "user://save.json"

static func save_state(pos: Vector3, health: float, flags: Dictionary) -> void:
	var data := {
		"pos": [pos.x, pos.y, pos.z],
		"health": health,
		"flags": flags,
	}
	var f := FileAccess.open(PATH, FileAccess.WRITE)
	if f != null:
		f.store_string(JSON.stringify(data))
		f.close()

static func load_state() -> Dictionary:
	if not FileAccess.file_exists(PATH):
		return {}
	var f := FileAccess.open(PATH, FileAccess.READ)
	if f == null:
		return {}
	var parsed = JSON.parse_string(f.get_as_text())
	if parsed is Dictionary:
		return parsed
	return {}
