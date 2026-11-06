extends Node
class_name KotodamaGame

## Main game root (KOTODAMA) — v2. Wires Player/Boss/HUD/DialogueUI,
## pause/interact/save, opening cinematic, torii rest ritual, and boss intro.
## All flags persist through KotodamaSave.

var player: KotodamaPlayer
var boss: KotodamaBoss
var hud: Node
var dialogue_ui: Node
var flags := {}
var paused := false
var boss_intro_played := false

const TORII_POS := Vector3(0.0, 0.0, 30.0)
const TORII_RANGE := 5.0

func _ready() -> void:
	player = get_node_or_null("Player") as KotodamaPlayer
	boss = get_node_or_null("Boss") as KotodamaBoss
	hud = get_node_or_null("HUD")
	dialogue_ui = get_node_or_null("DialogueUI")
	if player != null:
		player.health_changed.connect(_on_player_health)
		player.posture_changed.connect(_on_player_posture)
		player.parried.connect(func() -> void:
			if hud != null and hud.has_method("show_callout"):
				hud.show_callout("Perfect parry — riposte is yours.", 1.4))
		player.lock_target_changed.connect(_on_lock_changed)
	if boss != null:
		boss.died.connect(_on_boss_died)
		boss.intro_started.connect(_on_boss_intro)
	var saved: Dictionary = KotodamaSave.load_state()
	if saved.has("flags") and saved["flags"] is Dictionary:
		flags = saved["flags"]
	# Opening cinematic.
	await get_tree().create_timer(0.6).timeout
	_play_opening()

func _play_opening() -> void:
	if dialogue_ui == null:
		return
	dialogue_ui.show_line("Narrator", "The sea does not forget. It keeps every word spoken into it.", 3.2)
	await get_tree().create_timer(3.4).timeout
	if not flags.get("opening_done", false):
		flags["opening_done"] = true
		KotodamaSave.save_state(player.global_position, player.health, flags)
	dialogue_ui.show_line("Narrator", "Your name is the only blade that still holds an edge.", 3.2)
	set_objective("Find Ame at the torii. The Drowned General waits at the cliff.")

func set_objective(text: String) -> void:
	if hud != null and hud.has_method("set_objective"):
		hud.set_objective(text)

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
	if player == null:
		return
	# Torii rest ritual acts as a checkpoint: save + heal + objective hint.
	var to_torii := player.global_position - TORII_POS
	to_torii.y = 0.0
	if to_torii.length() < TORII_RANGE:
		_rest_at_torii()
		return
	if flags.get("met_ame", false):
		if dialogue_ui != null:
			dialogue_ui.show_line("Ame", "The General is still at the cliff. Give him his rest.")
		return
	if dialogue_ui != null:
		flags["met_ame"] = true
		KotodamaSave.save_state(player.global_position, player.health, flags)
		dialogue_ui.show_line("Ame", "You came up from the beach. The sea usually keeps what it takes.")
		await get_tree().create_timer(3.2).timeout
		dialogue_ui.show_line("Ame", "A word spoken into the tide becomes a debt. You carry many.")
		set_objective("Speak with Ame, then cross the shore to the cliff.")

func _rest_at_torii() -> void:
	if player.has_method("rest"):
		player.rest()
	flags["last_rest"] = true
	KotodamaSave.save_state(player.global_position, player.health, flags)
	if dialogue_ui != null:
		dialogue_ui.show_line("Narrator", "You rest beneath the torii. The tide holds its breath.", 2.8)
	set_objective("Speak with Ame, then cross the shore to the cliff.")

func _on_lock_changed(target: Node3D) -> void:
	if hud != null and hud.has_method("set_lockon"):
		hud.set_lockon(target != null)

func _on_player_health(current: float, maximum: float) -> void:
	if hud != null and hud.has_method("set_health"):
		hud.set_health(current, maximum)
	if current <= 0.0:
		var saved: Dictionary = KotodamaSave.load_state()
		if saved.has("pos") and player != null:
			var p: Array = saved["pos"]
			player.global_position = Vector3(p[0], p[1], p[2])
		if player != null:
			player.rest()
		if dialogue_ui != null:
			dialogue_ui.show_line("Narrator", "The tide returns you to the shore.", 2.6)

func _on_player_posture(current: float, maximum: float) -> void:
	if hud != null and hud.has_method("set_posture"):
		hud.set_posture(current, maximum)

func _on_boss_intro(_b: KotodamaBoss) -> void:
	if boss_intro_played:
		return
	boss_intro_played = true
	if dialogue_ui != null:
		dialogue_ui.show_line("The Drowned General", "You carry the word of the shore. I will take it.", 3.0)
	set_objective("Break the Drowned General's posture. Slay him.")
	if hud != null and hud.has_method("set_boss_hp"):
		hud.set_boss_hp(boss.hp, boss.max_hp)

func _on_boss_died(_b: KotodamaBoss) -> void:
	flags["boss_slain"] = true
	KotodamaSave.save_state(player.global_position, player.health, flags)
	if dialogue_ui != null:
		dialogue_ui.show_line("Narrator", "The Drowned General sinks into the tide. His name is yours now.", 4.5)
	if hud != null and hud.has_method("set_boss_hp"):
		hud.set_boss_hp(0.0, 1.0)
	set_objective("The Drowned General is slain. The shore can breathe.")
