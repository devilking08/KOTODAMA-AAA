extends SceneTree

## Runtime smoke v2: instantiate main.tscn, exercise player defense
## (dodge/parry), attack, boss phase change, dialogue flag and save.

func _initialize() -> void:
	var scene: PackedScene = load("res://scenes/main.tscn")
	var inst := scene.instantiate()
	root.add_child(inst)
	await create_timer(2.0).timeout

	var players := get_nodes_in_group("player")
	var enemies := get_nodes_in_group("enemy")
	print("SMOKE players=", players.size(), " enemies=", enemies.size())

	if players.size() == 0:
		quit(1)
		return

	var p: Node = players[0]

	# Dodge grants i-frames: damage during dodge is ignored.
	p.dodge_timer = 0.3
	p.invuln_timer = 0.4
	var hp_before: float = p.health
	p.take_damage(50.0)
	print("SMOKE dodge_absorbed=", p.health == hp_before)

	# Parry stance negates damage.
	p.guarding = true
	p.guard_timer = 0.05
	hp_before = p.health
	p.take_damage(50.0)
	print("SMOKE parry_absorbed=", p.health == hp_before)

	# Boss fights: drive it to phase 2 then defeat.
	var boss: Node = inst.get_node_or_null("Boss")
	if boss != null:
		boss.take_damage(boss.max_hp * 0.6)
		print("SMOKE boss_phase=", boss.phase)
		boss.take_damage(boss.max_hp)
		await create_timer(0.4).timeout
		print("SMOKE boss_dead=", boss.dead)

	# Save round-trip.
	KotodamaSave.save_state(p.global_position, p.health, { "demo": true })
	var saved: Dictionary = KotodamaSave.load_state()
	print("SMOKE save_roundtrip=", saved.get("flags", {}).get("demo", false))

	quit(0)
