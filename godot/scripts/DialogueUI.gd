extends CanvasLayer
class_name KotodamaDialogueUI

## Minimal cinematic dialogue box (KOTODAMA) — v2 with fade + speaker color.

@onready var panel: Control = $Control
@onready var speaker: Label = $Control/SpeakerLabel
@onready var text: Label = $Control/TextLabel

func _ready() -> void:
	panel.visible = false
	panel.modulate.a = 0.0
	speaker.add_theme_color_override("font_color", Color(1.0, 0.78, 0.5))

func show_line(speaker_name: String, line: String, duration := 3.0) -> void:
	if speaker != null:
		speaker.text = speaker_name
	if text != null:
		text.text = line
	panel.visible = true
	var tw := create_tween()
	tw.tween_property(panel, "modulate:a", 1.0, 0.18)
	await tw.finished
	await get_tree().create_timer(duration).timeout
	hide_box()

func hide_box() -> void:
	var tw := create_tween()
	tw.tween_property(panel, "modulate:a", 0.0, 0.18)
	await tw.finished
	panel.visible = false
