--!strict
-- PlayerController: third-person controller (camera orbit, WASD movement,
-- sprint, dodge with i-frames, parry stance, buffered melee combos).
-- Feel mirrors the Godot port: posture-based exchanges, perfect parry.

local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local CombatConfig = require(ReplicatedStorage.Kotodama.CombatConfig)
local Events = require(ReplicatedStorage.Kotodama.Events)

local player = Players.LocalPlayer
local camera = workspace.CurrentCamera
local yaw = 0
local pitch = 0
local comboStage = 0
local lastAttackAt = 0
local bufferUntil = 0
local dodgeReadyAt = 0

local function setupCharacter(char: Model)
	local hrp = char:WaitForChild("HumanoidRootPart")
	local humanoid = char:WaitForChild("Humanoid")

	-- Input
	UserInputService.InputBegan:Connect(function(input, processed)
		if processed then
			return
		end
		if input.UserInputType == Enum.UserInputType.MouseButton1 then
			local now = os.clock()
			if now < bufferUntil then
				return
			end
			if now - lastAttackAt > CombatConfig.ComboWindow then
				comboStage = 0
			end
			Events.MeleeConnect:FireServer(comboStage)
			comboStage = (comboStage + 1) % 3
			lastAttackAt = now
			bufferUntil = now + CombatConfig.AttackBuffer
		elseif input.KeyCode == Enum.KeyCode.Q then
			hrp:SetAttribute("ParryStarted", os.clock())
			hrp:SetAttribute("ParryingUntil", os.clock() + 0.12)
		elseif input.KeyCode == Enum.KeyCode.Space then
			local now = os.clock()
			if now >= dodgeReadyAt then
				local fwd = hrp.CFrame.LookVector
				hrp.AssemblyLinearVelocity = Vector3.new(fwd.X, 0, fwd.Z) * CombatConfig.Dodge.Speed
				hrp:SetAttribute("DodgingUntil", os.clock() + CombatConfig.Dodge.IFrameWindow)
				dodgeReadyAt = now + 0.55
			end
		end
	end)

	UserInputService.InputEnded:Connect(function(input)
		if input.KeyCode == Enum.KeyCode.Q then
			hrp:SetAttribute("ParryingUntil", 0)
		end
	end)

	-- Camera orbit
	RunService.RenderStepped:Connect(function()
		local mouseDelta = UserInputService:GetMouseDelta()
		yaw -= mouseDelta.X * 0.0022
		pitch = math.clamp(pitch - mouseDelta.Y * 0.0022, -0.6, 1.0)
		local camCF = hrp.CFrame * CFrame.Angles(pitch, yaw, 0) * CFrame.new(0, 3.2, 9)
		camera.CFrame = CFrame.new(camCF.Position, hrp.Position + Vector3.new(0, 2, 0))
	end)

	-- Movement (camera-relative)
	RunService.Heartbeat:Connect(function()
		local move = Vector3.new(
			(UserInputService:IsKeyDown(Enum.KeyCode.D) and 1 or 0) - (UserInputService:IsKeyDown(Enum.KeyCode.A) and 1 or 0),
			0,
			(UserInputService:IsKeyDown(Enum.KeyCode.S) and 1 or 0) - (UserInputService:IsKeyDown(Enum.KeyCode.W) and 1 or 0)
		)
		if move.Magnitude > 0 then
			move = move.Unit
			local rel = camera.CFrame:VectorToWorldSpace(move)
			rel = Vector3.new(rel.X, 0, rel.Z).Unit
			humanoid.MoveDirection = rel
		else
			humanoid.MoveDirection = Vector3.new(0, 0, 0)
		end
		local sprint = UserInputService:IsKeyDown(Enum.KeyCode.LeftShift)
		humanoid.WalkSpeed = if sprint then 26 else 16
	end)
end

if player.Character then
	setupCharacter(player.Character)
end
player.CharacterAdded:Connect(setupCharacter)
