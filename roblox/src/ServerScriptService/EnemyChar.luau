--!strict
-- EnemyChar: builds a cheap, readable enemy model from parts (no external
-- assets). One "heart" part drives logic; visual parts are welded on.

local CombatConfig = require(script.Parent.CombatConfig)

local EnemyChar = {}

local function newPart(color: Color3, size: Vector3, pos: Vector3, parent: Instance): BasePart
	local part = Instance.new("Part")
	part.Shape = Enum.PartType.Block
	part.Size = size
	part.Position = pos
	part.Anchored = false
	part.CanCollide = false
	part.Color = color
	part.Material = Enum.Material.SmoothPlastic
	part.Parent = parent
	return part
end

function EnemyChar.create(role: string, spawnPos: Vector3): Model
	local model = Instance.new("Model")
	model.Name = role == "boss" and "DrownedGeneral" or "Grunt"
	model.Parent = workspace

	local heart = Instance.new("Part")
	heart.Name = "Heart"
	heart.Size = Vector3.new(2, 2, 2)
	heart.Position = spawnPos + Vector3.new(0, 3, 0)
	heart.Transparency = 1
	heart.CanCollide = false
	heart.Anchored = false
	heart.Parent = model

	local robeColor = role == "boss" and CombatConfig.Palette.BossRobe or CombatConfig.Palette.GruntRobe
	local torso = newPart(robeColor, Vector3.new(1.6, 3, 1.1), spawnPos + Vector3.new(0, 3.5, 0), model)
	torso.Name = "Torso"

	local head
	if role == "boss" then
		head = newPart(CombatConfig.Palette.WarmSand, Vector3.new(1.1, 1.1, 1.1), spawnPos + Vector3.new(0, 5.4, 0), model)
		head.Name = "Head"
	else
		head = newPart(CombatConfig.Palette.DeepWarm, Vector3.new(0.9, 0.9, 0.9), spawnPos + Vector3.new(0, 5.1, 0), model)
		head.Name = "Head"
	end

	local hp = Instance.new("IntValue")
	hp.Name = "HP"
	hp.Value = if role == "boss" then CombatConfig.Boss.MaxHp else CombatConfig.Enemy.MaxHp
	hp.Parent = model

	local posture = Instance.new("IntValue")
	posture.Name = "Posture"
	posture.Value = if role == "boss" then CombatConfig.Boss.MaxPosture else CombatConfig.Enemy.MaxPosture
	posture.Parent = model

	local phase = Instance.new("IntValue")
	phase.Name = "Phase"
	phase.Value = 1
	phase.Parent = model

	local state = Instance.new("StringValue")
	state.Name = "State"
	state.Value = "idle"
	state.Parent = model

	local roleVal = Instance.new("StringValue")
	roleVal.Name = "Role"
	roleVal.Value = role
	roleVal.Parent = model

	return model
end

return EnemyChar
