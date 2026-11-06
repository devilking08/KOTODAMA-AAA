extends CanvasLayer
class_name KotodamaHUD

## HUD (KOTODAMA) — v2: vitality/posture bars, objective label, lock-on
## reticle, boss health bar, and transient callouts (telegraph warnings).

signal boss_bar_toggled(active: bool)

@onready var health_bar: ProgressBar = $Control/HealthBar
@onready var posture_bar: ProgressBar = $Control/PostureBar
@onready var health_label: Label = $Control/HealthLabel
@onready var posture_label: Label = $Control/PostureLabel
@onready var objective_label: Label = $Control/ObjectiveLabel
@onready var boss_bar: ProgressBar = $Control/BossBar
@onready var boss_label: Label = $Control/BossLabel
@onready var lockon_label: Label = $Control/LockonLabel
@onready var callout_label: Label = $Control/CalloutLabel

func set_objective(text: String) -> void:
	if objective_label != null:
		objective_label.text = text

func set_health(current: float, maximum: float) -> void:
	if health_bar != null:
		health_bar.max_value = maximum
		health_bar.value = current
	if health_label != null:
		health_label.text = "VITALITY %d/%d" % [int(current), int(maximum)]

func set_posture(current: float, maximum: float) -> void:
	if posture_bar != null:
		posture_bar.max_value = maximum
		posture_bar.value = current
	if posture_label != null:
		posture_label.text = "POSTURE %d/%d" % [int(current), int(maximum)]

func set_boss_hp(current: float, maximum: float) -> void:
	if boss_bar == null:
		return
	boss_bar.max_value = maximum
	boss_bar.value = current
	boss_bar.visible = current > 0.0
	boss_label.visible = current > 0.0

func set_lockon(active: bool) -> void:
	if lockon_label != null:
		lockon_label.visible = active

func show_callout(text: String, duration := 1.6) -> void:
	if callout_label == null:
		return
	callout_label.text = text
	callout_label.modulate.a = 1.0
	callout_label.visible = true
	var tw := create_tween()
	tw.tween_interval(duration)
	tw.tween_property(callout_label, "modulate:a", 0.0, 0.4)
	tw.tween_callback(func() -> void: callout_label.visible = false)
