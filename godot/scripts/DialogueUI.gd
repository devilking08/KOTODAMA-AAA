extends CanvasLayer
class_name KotodamaDialogueUI

## Minimal cinematic dialogue box.

@onready var panel: Control = $Control
@onready var speaker: Label = $Control/SpeakerLabel
@onready var text: Label = $Control/TextLabel

func _ready() -> void:
	panel.visible = false

func show_line(speaker_name: String, line: String, duration := 3.0) -> void:
	speaker.text = speaker_name
	text.text = line
	panel.visible = true
	await get_tree().create_timer(duration).timeout
	panel.visible = false

func hide_box() -> void:
	panel.visible = false
