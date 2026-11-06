--!strict
-- WorldBuilder: builds the Shore of Broken Words entirely from parts at
-- runtime (mirrors the Godot port's builder pattern). Low-cost visuals:
-- neon-free, one PointLight per lantern, water + foam as translucent parts.

local CombatConfig = require(game.ReplicatedStorage.Kotodama.CombatConfig)
local P = CombatConfig.Palette

local function part(name: string, color: Color3, size: Vector3, pos: Vector3, transparency: number, parent: Instance): BasePart
	local p = Instance.new("Part")
	p.Name = name
	p.Shape = Enum.PartType.Block
	p.Size = size
	p.Position = pos
	p.Anchored = true
	p.CanCollide = false
	p.Color = color
	p.Material = Enum.Material.SmoothPlastic
	p.Transparency = transparency
	p.Parent = parent
	return p
end

local function torii(cx: number, cz: number, parent: Instance)
	local g = Instance.new("Folder")
	g.Name = "Torii"
	g.Parent = parent
	for _, side in { -2, 2 } do
		part("Pillar", P.ToriiRed, Vector3.new(0.7, 8, 0.7), Vector3.new(cx + side, 4, cz), 0, g)
	end
	part("Beam", P.ToriiRed, Vector3.new(5.6, 1, 1), Vector3.new(cx, 8.2, cz), 0, g)
	part("Plaque", P.DeepWarm, Vector3.new(1.6, 0.7, 0.3), Vector3.new(cx, 7.4, cz), 0, g)
end

local function lantern(cx: number, cz: number, parent: Instance)
	local pole = part("Pole", P.DeepWarm, Vector3.new(0.25, 3, 0.25), Vector3.new(cx, 1.5, cz), 0, parent)
	local glow = part("Glow", P.LanternGlow, Vector3.new(0.7, 0.7, 0.7), Vector3.new(cx, 3.2, cz), 0.25, parent)
	local light = Instance.new("PointLight")
	light.Color = P.LanternGlow
	light.Brightness = 2
	light.Range = 14
	light.Parent = glow
end

function WorldBuilder.build()
	local ws = workspace

	-- Ground
	part("Ground", P.WarmSand, CombatConfig.World.GroundSize, Vector3.new(0, 0, 0), 0, ws)
	-- Water (deep, ahead of spawn)
	part("Water", P.WaterDeep, Vector3.new(360, 1, 260), Vector3.new(0, CombatConfig.World.WaterY, -120), 0.35, ws)
	-- Shoreline foam between land and water
	part("Foam", P.Foam, Vector3.new(360, 0.6, 18), Vector3.new(0, CombatConfig.World.WaterY + 0.4, -28), 0.6, ws)
	-- Torii + lanterns
	torii(0, 45, ws)
	lantern(6, 50, ws)
	lantern(-6, 50, ws)
	torii(-70, -70, ws)
	lantern(-60, -80, ws)
end

return WorldBuilder
