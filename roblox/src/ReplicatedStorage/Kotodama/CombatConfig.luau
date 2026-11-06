--!strict
-- CombatConfig: single source of truth for all tuned values (data-driven).

local CombatConfig = {
	ComboDamage = { 26, 30, 42 },
	PostureDamagePerHit = { 10, 12, 22 },
	RiposteDamage = 60,
	DashAttackDamage = 32,
	ComboWindow = 0.8,
	AttackBuffer = 0.18,
	AttackCooldown = { 0.35, 0.35, 0.6 },
	HitRange = 2.1,
	Enemy = {
		MaxHp = 70,
		MaxPosture = 60,
		DetectRange = 16,
		AttackRange = 2.4,
		Damage = 12,
		TelegraphTime = 0.45,
		PostureBreakTime = 2.2,
		ChaseSpeed = 8,
		LungeSpeed = 18,
	},
	Boss = {
		MaxHp = 420,
		MaxPosture = 140,
		DetectRange = 22,
		AttackRange = 3.2,
		Damage = 20,
		Phase2HpRatio = 0.5,
		TelegraphTime = 0.55,
		ChaseSpeed = 6.5,
		Phase2ChaseSpeed = 8.5,
		LungeSpeed = 26,
	},
	Dodge = {
		Duration = 0.28,
		Speed = 26,
		IFrameWindow = 0.36,
	},
	Parry = {
		PerfectWindow = 0.18,
	},
	World = {
		GroundSize = Vector3.new(420, 4, 420),
		WaterY = 1.2,
	},
	Palette = {
		WarmSand = Color3.fromRGB(224, 186, 122),
		DeepWarm = Color3.fromRGB(82, 64, 45),
		ToriiRed = Color3.fromRGB(168, 59, 43),
		LanternGlow = Color3.fromRGB(255, 178, 89),
		GoldTelegraph = Color3.fromRGB(255, 191, 64),
		RedTelegraph = Color3.fromRGB(255, 51, 26),
		WaterDeep = Color3.fromRGB(31, 77, 97),
		Foam = Color3.fromRGB(217, 230, 235),
		BossRobe = Color3.fromRGB(31, 51, 71),
		GruntRobe = Color3.fromRGB(71, 31, 26),
		PlayerRobe = Color3.fromRGB(41, 33, 26),
	},
}

return CombatConfig
