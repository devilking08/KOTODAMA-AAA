--!strict
-- CombatServer: resolves melee hits and damage to players/enemies.
-- Mirrors the Godot port's rules: posture break -> stagger window; dodge
-- i-frames negate; perfect parry (first 0.18s of stance) negates + builds
-- posture; gold = blockable, red = unblockable.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local CombatConfig = require(ReplicatedStorage.Kotodama.CombatConfig)
local Events = require(ReplicatedStorage.Kotodama.Events)
local P = CombatConfig.Palette

local function findNearestPlayer(pos: Vector3): (Model?, number)
	local best: Model?
	local bestDist = math.huge
	for _, p in ipairs(game:GetService("Players"):GetPlayers()) do
		local char = p.Character
		if char then
			local hrp = char:FindFirstChild("HumanoidRootPart")
			if hrp then
				local d = (hrp.Position - pos).Magnitude
				if d < bestDist then
					bestDist = d
					best = char
				end
			end
		end
	end
	return best, bestDist
end

local function isDodging(char: Model): boolean
	local hrp = char:FindFirstChild("HumanoidRootPart")
	return hrp ~= nil and (hrp:GetAttribute("DodgingUntil") or 0) > os.clock()
end

local function isParrying(char: Model): boolean
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if not hrp then
		return false
	end
	local untilT = hrp:GetAttribute("ParryingUntil") or 0
	local startT = hrp:GetAttribute("ParryStarted") or 0
	return untilT > os.clock() and (os.clock() - startT) <= CombatConfig.Parry.PerfectWindow
end

local function damagePlayer(char: Model, amount: number, blockable: boolean)
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if not hrp or isDodging(char) then
		return
	end
	if blockable and isParrying(char) then
		Events.RiposteReady:FireClient(game:GetService("Players"):GetPlayerFromCharacter(char))
		return
	end
	local humanoid = char:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid:TakeDamage(amount)
	end
	Events.PlayerDamaged:FireClient(game:GetService("Players"):GetPlayerFromCharacter(char), amount)
end

local function dealMelee(origin: Vector3, damage: number, postureDmg: number, isHeavy: boolean)
	for _, enemy in ipairs(workspace:GetChildren()) do
		if enemy:IsA("Model") and enemy:FindFirstChild("Heart") then
			local heart = enemy:FindFirstChild("Heart")
			if (heart.Position - origin).Magnitude <= CombatConfig.HitRange then
				local hp = enemy:FindFirstChild("HP")
				local posture = enemy:FindFirstChild("Posture")
				if hp and posture and hp.Value > 0 then
					hp.Value -= damage
					posture.Value = math.max(posture.Value - postureDmg, 0)
					if posture.Value <= 0 then
						posture.Value = if enemy:FindFirstChild("Role") and enemy.Role.Value == "boss" then CombatConfig.Boss.MaxPosture else CombatConfig.Enemy.MaxPosture
						enemy:FindFirstChild("State").Value = "stagger"
						task.delay(if enemy.Role.Value == "boss" then 2.2 else CombatConfig.Enemy.PostureBreakTime, function()
							if enemy.Parent then
								enemy.State.Value = "idle"
							end
						end)
					end
					if hp.Value <= 0 then
						enemy:Destroy()
						if enemy:FindFirstChild("Role") and enemy.Role.Value == "boss" then
							Events.BossSlain:FireAllClients()
							Events.Objective:FireAllClients("The Drowned General is slain. The shore can breathe.")
						end
						return
					end
				end
			end
		end
	end
end

Events.MeleeConnect.OnServerEvent:Connect(function(player, stage)
	local char = player.Character
	if not char then
		return
	end
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if not hrp then
		return
	end
	local stageN = if type(stage) == "number" then stage else 0
	local dmg = CombatConfig.ComboDamage[stageN + 1] or CombatConfig.ComboDamage[1]
	local postureDmg = CombatConfig.PostureDamagePerHit[stageN + 1] or 10
	local origin = hrp.Position + hrp.CFrame.LookVector * 2.4
	dealMelee(origin, dmg, postureDmg, stageN == 2)
end)

return {
	dealMelee = dealMelee,
	damagePlayer = damagePlayer,
	isDodging = isDodging,
	isParrying = isParrying,
	findNearestPlayer = findNearestPlayer,
}
