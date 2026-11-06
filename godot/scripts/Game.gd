extends Node

## Main game root: wires the player, boss, HUD, dialogue and save/rest.

var player: KotodamaPlayer
var boss: KotodamaBoss
var hud: Node
var dialogue_ui: Node
var flags := {}
var paused := false

func _ready() -> void:
	player = get_node_or_null("Player") as KotodamaPlayer
	boss = get_node_or_null("Boss") as KotodamaBoss
	hud = get_node_or_null("HUD")
	dialogue_ui = get_node_or_null("DialogueUI")
	if player != null:
		player.health_changed.connect(_on_player_health)
		if hud != null and hud.has_method("set_objective"):
			hud.set_objective("Reach the Drowned General and break his posture.")
	if boss != null:
		boss.died.connect(_on_boss_died)
	var saved: Dictionary = KotodamaSave.load_state()
	if saved.has("flags") and saved["flags"] is Dictionary:
		flags = saved["flags"]

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		paused = not paused
		get_tree().paused = paused
		await get_tree().process_frame
	if event.is_action_pressed("attack") and not paused and player != null:
		player.try_attack()
	if event.is_action_pressed("interact") and not paused:
		_on_interact()

func _on_interact() -> void:
	if dialogue_ui == null:
		return
	if not flags.get("met_ame", false):
		flags["met_ame"] = true
		KotodamaSave.save_state(player.global_position, player.health, flags)
		dialogue_ui.show_line("Ame", "You came up from the beach. The sea usually keeps what it takes.")
	else:
		dialogue_ui.show_line("Ame", "The General is still at the cliff. Give him his rest.")

func _on_player_health(current: float, maximum: float) -> void:
	if current <= 0.0:
		# Respawn at saved position with full health.
		var saved: Dictionary = KotodamaSave.load_state()
		if saved.has("pos") and player != null:
			var p: Array = saved["pos"]
			player.global_position = Vector3(p[0], p[1], p[2])
		player.rest()

func _on_boss_died(_b: KotodamaBoss) -> void:
	flags["boss_slain"] = true
	KotodamaSave.save_state(player.global_position, player.health, flags)
	if dialogue_ui != null:
		dialogue_ui.show_line("Narrator", "The Drowned General sinks into the tide. His name is yours now.", 4.5)
	if hud != null and hud.has_method("set_objective"):
		hud.set_objective("The Drowned General is slain. The shore can breathe.")
