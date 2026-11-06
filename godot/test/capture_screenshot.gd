extends SceneTree

## Windowed render capture: boots main.tscn, lets it settle, captures the
## viewport to res://screenshots/kotodama_firstlight.png, quits.
## Run WITHOUT --headless so a real render surface exists.

const OUT := "res://screenshots/kotodama_firstlight.png"

func _initialize() -> void:
	var scene: PackedScene = load("res://scenes/main.tscn")
	var inst := scene.instantiate()
	root.add_child(inst)
	# Let physics/HUD/dialogue settle and a few frames render.
	for i in 150:
		await process_frame
	await RenderingServer.frame_post_draw
	var img := root.get_texture().get_image()
	if img == null:
		print("CAPTURE error no_image")
		quit(1)
		return
	var err := img.save_png(OUT)
	print("CAPTURE saved=", OUT, " err=", err, " size=", img.get_size())
	quit(0 if err == OK else 1)
