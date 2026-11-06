extends CanvasLayer
class_name KotodamaHUD

## Minimal surgical HUD: health + posture bars, fed by player signals.

@onready var health_bar: ProgressBar = $Control/HealthBar
@onready var posture_bar: ProgressBar = $Control/PostureBar
@onready var health_label: Label = $Control/HealthLabel
@onready var posture_label: Label = $Control/PostureLabel
@onready var objective_label: Label = $Control/ObjectiveLabel

func set_objective(text: String) -> void:
	if objective_label != null:
		objective_label.text = text

func bind_player(player: Node) -> void:
	if player.has_signal("health_changed"):
		player.health_changed.connect(_on_health_changed)
	if player.has_signal("posture_changed"):
		player.posture_changed.connect(_on_posture_changed)

func _on_health_changed(current: float, maximum: float) -> void:
	if health_bar != null:
		health_bar.max_value = maximum
		health_bar.value = current
	if health_label != null:
		health_label.text = "VITALITY %d/%d" % [int(current), int(maximum)]

func _on_posture_changed(current: float, maximum: float) -> void:
	if posture_bar != null:
		posture_bar.max_value = maximum
		posture_bar.value = current
	if posture_label != null:
		posture_label.text = "POSTURE %d/%d" % [int(current), int(maximum)]

func _on_damage_taken(amount: float) -> void:
	# Shake the HUD panel on heavy hits for impact feedback.
	get_node("Control").position = Vector2(randf_range(-6.0, 6.0), randf_range(-6.0, 6.0))
	await get_tree().create_timer(0.08).timeout
	get_node("Control").position = Vector2.ZERO
