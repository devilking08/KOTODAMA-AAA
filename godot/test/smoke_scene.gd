extends SceneTree

## Runtime smoke v3: instantiate main.tscn, exercise player defense
## (dodge/parry), combo chain, dash-attack, riposte, boss phase/death,
## shockwave FX, dialogue flag and save. Exits 1 on any failure.

var failures := 0

func check(label: String, ok: bool) -> void:
	if ok:
		print("SMOKE ", label, "=true")
	else:
		failures += 1
		print("SMOKE ", label, "=false")

func _initialize() -> void:
	var scene: PackedScene = load("res://scenes/main.tscn")
	var inst := scene.instantiate()
	root.add_child(inst)
	await create_timer(2.0).timeout

	var players := get_nodes_in_group("player")
	var enemies := get_nodes_in_group("enemy")
	check("players", players.size() == 1)
	check("enemies", enemies.size() == 3)

	var p: Node = players[0]

	# Dodge grants i-frames: damage during dodge is ignored.
	p.dodge_timer = 0.3
	p.invuln_timer = 0.4
	var hp_before: float = p.health
	p.take_damage(50.0)
	check("dodge_absorbed", p.health == hp_before)

	# Parry stance negates damage.
	p.guarding = true
	p.guard_timer = 0.05
	hp_before = p.health
	p.take_damage(50.0)
	check("parry_absorbed", p.health == hp_before)
	p.guarding = false

	# Combo chain: two rapid attacks -> step 2; chaining third -> step 0 wrap.
	p.try_attack()
	p.try_attack()
	check("combo_chains", p.combo_steps == 2)
	p.try_attack()
	check("combo_wraps", p.combo_steps == 0)

	# Dash-attack: while dodging, attack becomes a dash slash.
	p.dodge_timer = 0.3
	p.try_attack()
	check("dash_attack_pending", p.dash_attack_pending == true)
	p.dodge_timer = 0.0
	p.dash_attack_pending = false

	# Riposte: posture-break an enemy, then the next attack becomes a riposte.
	var enemy: Node = enemies[0]
	enemy.global_position = p.global_position - Vector3(0.0, 0.0, -1.0)
	enemy.take_damage(1.0, 1000.0)
	check("enemy_staggered", enemy.stagger_timer > 0.0)
	p.try_attack()
	check("riposte_ready", p.riposte_ready == true)
	var rip_dmg: float = p.riposte_damage
	p.try_attack()
	check("riposte_consumed", p.riposte_ready == false and rip_dmg >= 60.0)
	p.riposte_ready = false

	# Boss fights: drive to phase 2 (shockwave spawns) then defeat.
	var boss: Node = inst.get_node_or_null("Boss")
	if boss != null:
		boss.take_damage(boss.max_hp * 0.6)
		await create_timer(0.3).timeout
		check("boss_phase", boss.phase == 2)
		check("boss_shockwave", root.find_child("Shockwave", true, false) != null)
		boss.take_damage(boss.max_hp)
		await create_timer(0.6).timeout
		check("boss_dead", boss.dead)

	# Save round-trip.
	KotodamaSave.save_state(p.global_position, p.health, { "demo_v3": true })
	var saved: Dictionary = KotodamaSave.load_state()
	check("save_roundtrip", saved.get("flags", {}).get("demo_v3", false))

	print("SMOKE_RESULT failures=", failures)
	quit(1 if failures > 0 else 0)
