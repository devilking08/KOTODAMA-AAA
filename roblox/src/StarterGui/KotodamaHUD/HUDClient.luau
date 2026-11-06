--!strict
-- HUDClient: builds the game HUD programmatically (health/posture bars,
-- boss bar, objective line, callouts) and reacts to replicated events.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Events = require(ReplicatedStorage.Kotodama.Events)
local player = Players.LocalPlayer

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "KotodamaHUD"
screenGui.ResetOnSpawn = false
screenGui.Parent = player:WaitForChild("PlayerGui")

local function makeLabel(parent: Instance, name: string, pos: UDim2, size: UDim2, text: string, sizeScale: number, color: Color3): TextLabel
	local label = Instance.new("TextLabel")
	label.Name = name
	label.Position = pos
	label.Size = size
	label.BackgroundTransparency = 1
	label.Text = text
	label.TextColor3 = color
	label.TextSize = sizeScale
	label.TextXAlignment = Enum.TextXAlignment.Left
	label.Parent = parent
	return label
end

local function makeBar(parent: Instance, name: string, pos: UDim2, size: UDim2, bg: Color3, fg: Color3): (Frame, Frame)
	local frame = Instance.new("Frame")
	frame.Name = name
	frame.Position = pos
	frame.Size = size
	frame.BackgroundColor3 = bg
	frame.BackgroundTransparency = 0.35
	frame.BorderSizePixel = 0
	frame.Parent = parent
	local fill = Instance.new("Frame")
	fill.Name = "Fill"
	fill.Size = UDim2.fromScale(1, 1)
	fill.BackgroundColor3 = fg
	fill.BorderSizePixel = 0
	fill.Parent = frame
	return frame, fill
end

local healthFrame, healthFill = makeBar(screenGui, "HealthBar", UDim2.new(0, 24, 0, 24), UDim2.new(0, 340, 0, 20), Color3.fromRGB(30, 26, 20), Color3.fromRGB(200, 70, 52))
local postureFrame, postureFill = makeBar(screenGui, "PostureBar", UDim2.new(0, 24, 0, 50), UDim2.new(0, 340, 0, 14), Color3.fromRGB(30, 26, 20), Color3.fromRGB(240, 205, 128))
local bossFrame, bossFill = makeBar(screenGui, "BossBar", UDim2.new(0.5, -170, 0, 24), UDim2.new(0, 340, 0, 16), Color3.fromRGB(30, 26, 20), Color3.fromRGB(220, 130, 70))
bossFrame.Visible = false
local objective = makeLabel(screenGui, "Objective", UDim2.new(0, 24, 1, -64), UDim2.new(0, 560, 0, 40), "The Shore of Broken Words.", 17, Color3.fromRGB(240, 228, 200))
local callout = makeLabel(screenGui, "Callout", UDim2.new(0.5, -200, 0, 80), UDim2.new(0, 400, 0, 40), "", 19, Color3.fromRGB(255, 230, 165))
callout.TextXAlignment = Enum.TextXAlignment.Center
callout.Visible = false

local function updateHealth()
	local char = player.Character
	if not char then
		return
	end
	local humanoid = char:FindFirstChildOfClass("Humanoid")
	if humanoid then
		healthFill.Size = UDim2.fromScale(math.clamp(humanoid.Health / humanoid.MaxHealth, 0, 1), 1)
	end
end

local function updatePosture()
	local char = player.Character
	if not char then
		return
	end
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if hrp then
		local drain = hrp:GetAttribute("Posture") or 100
		postureFill.Size = UDim2.fromScale(math.clamp(drain / 100, 0, 1), 1)
	end
end

local function shake(duration: number, magnitude: number)
	local cam = workspace.CurrentCamera
	if not cam then
		return
	end
	local base = cam.CFrame
	local t = 0
	while t < duration do
		t += task.wait()
		cam.CFrame = base * CFrame.new((math.random() - 0.5) * magnitude, (math.random() - 0.5) * magnitude, 0)
	end
	cam.CFrame = base
end

Events.Objective.OnClientEvent:Connect(function(text)
	objective.Text = text
end)

Events.BossBar.OnClientEvent:Connect(function(current, maximum)
	bossFrame.Visible = true
	bossFill.Size = UDim2.fromScale(math.clamp(current / maximum, 0, 1), 1)
end)

Events.BossSlain.OnClientEvent:Connect(function()
	bossFrame.Visible = false
end)

Events.Callout.OnClientEvent:Connect(function(text)
	callout.Text = text
	callout.Visible = true
	task.delay(2, function()
		callout.Visible = false
	end)
end)

Events.PlayerDamaged.OnClientEvent:Connect(function(_, amount)
	task.spawn(shake, 0.18, 0.5)
	callout.Text = string.format("-%d", amount)
	callout.Visible = true
	task.delay(0.9, function()
		callout.Visible = false
	end)
end)

Events.RiposteReady.OnClientEvent:Connect(function()
	callout.Text = "Perfect parry — riposte!"
	callout.Visible = true
	task.delay(1.4, function()
		callout.Visible = false
	end)
end)

local function onCharacter(char)
	char:WaitForChild("Humanoid").HealthChanged:Connect(updateHealth)
	char:WaitForChild("HumanoidRootPart"):GetAttributeChangedSignal("Posture"):Connect(updatePosture)
	updateHealth()
	updatePosture()
end

if player.Character then
	onCharacter(player.Character)
end
player.CharacterAdded:Connect(onCharacter)
