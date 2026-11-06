--!strict
-- EnemyDirector: spawns grunts + The Drowned General and runs their AI.
-- Telegraph flash = head turns gold (sweep/blockable) or red (thrust/
-- unblockable). Boss has two phases at 50% HP.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local CombatConfig = require(ReplicatedStorage.Kotodama.CombatConfig)
local Events = require(ReplicatedStorage.Kotodama.Events)
local CombatServer = require(script.Parent.CombatServer)
local EnemyChar = require(script.Parent.EnemyChar)

local P = CombatConfig.Palette

local function setTelegraph(model: Model, red: boolean)
	local head = model:FindFirstChild("Head")
	if head then
		head.Color = if red then P.RedTelegraph else P.GoldTelegraph
		head.Material = Enum.Material.Neon
	end
end

local function clearTelegraph(model: Model)
	local head = model:FindFirstChild("Head")
	if head then
		head.Color = if model:FindFirstChild("Role") and model.Role.Value == "boss" then P.WarmSand else P.DeepWarm
		head.Material = Enum.Material.SmoothPlastic
	end
end

local function runEnemy(model: Model, isBoss: boolean)
	local heart = model:FindFirstChild("Heart")
	local hp = model:FindFirstChild("HP")
	while model.Parent and hp and hp.Value > 0 do
		local player, dist = CombatServer.findNearestPlayer(heart.Position)
		local state = model:FindFirstChild("State")
		if state and player then
			if state.Value == "stagger" then
				task.wait(0.1)
			elseif dist > (if isBoss then CombatConfig.Boss.DetectRange else CombatConfig.Enemy.DetectRange) then
				if state.Value ~= "idle" then
					state.Value = "idle"
					clearTelegraph(model)
				end
				task.wait(0.2)
			else
				local attackRange = if isBoss then CombatConfig.Boss.AttackRange else CombatConfig.Enemy.AttackRange
				if dist > attackRange then
					state.Value = "chase"
					heart.AssemblyLinearVelocity = (player.HumanoidRootPart.Position - heart.Position).Unit * (if isBoss and model.Phase.Value == 2 then CombatConfig.Boss.Phase2ChaseSpeed else if isBoss then CombatConfig.Boss.ChaseSpeed else CombatConfig.Enemy.ChaseSpeed)
				else
					-- Telegraph then lunge (gold sweep / red thrust).
					local red = isBoss and model.Phase.Value == 2 and math.random() < 0.35
					setTelegraph(model, red)
					state.Value = "telegraph"
					task.wait(if isBoss then CombatConfig.Boss.TelegraphTime else CombatConfig.Enemy.TelegraphTime)
					if model.Parent then
						heart.AssemblyLinearVelocity = (player.HumanoidRootPart.Position - heart.Position).Unit * (if isBoss then CombatConfig.Boss.LungeSpeed else CombatConfig.Enemy.LungeSpeed)
						state.Value = "lunge"
						task.wait(0.35)
						heart.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
						if (player.HumanoidRootPart.Position - heart.Position).Magnitude < attackRange + 1.2 then
							CombatServer.damagePlayer(player, if isBoss then CombatConfig.Boss.Damage else CombatConfig.Enemy.Damage, not red)
						end
						clearTelegraph(model)
						state.Value = "recover"
						task.wait(0.8)
						state.Value = "idle"
					end
				end
			end
		else
			task.wait(0.25)
		end
	end
end

local function spawnGrunts()
	for i = 0, 1 do
		local model = EnemyChar.create("grunt", Vector3.new(-8 + i * 16, 1, 34))
		task.spawn(runEnemy, model, false)
	end
end

local function spawnBoss()
	local model = EnemyChar.create("boss", Vector3.new(0, 2, -130))
	local hp = model:FindFirstChild("HP")
	local phase = model:FindFirstChild("Phase")
	Events.Objective:FireAllClients("Reach the Drowned General at the cliff and break his posture.")
	Events.BossBar:FireAllClients(hp.Value, hp.Value)
	task.spawn(function()
		while model.Parent and hp and hp.Value > 0 do
			if hp.Value <= CombatConfig.Boss.MaxHp * CombatConfig.Boss.Phase2HpRatio and phase.Value == 1 then
				phase.Value = 2
				Events.Callout:FireAllClients("The Drowned General awakens — red thrusts are unblockable.")
			end
			Events.BossBar:FireAllClients(hp.Value, CombatConfig.Boss.MaxHp)
			task.wait(0.5)
		end
	end)
	task.spawn(runEnemy, model, true)
end

WorldBuilder = require(script.Parent.WorldBuilder)
WorldBuilder.build()
spawnGrunts()
spawnBoss()
Events.Objective:FireAllClients("The Shore of Broken Words. Find Ame at the torii.")
