--!strict
-- Events: single registry for all cross-client/server events.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local EventsFolder = ReplicatedStorage:FindFirstChild("KotodamaEvents")
if not EventsFolder then
	EventsFolder = Instance.new("Folder")
	EventsFolder.Name = "KotodamaEvents"
	EventsFolder.Parent = ReplicatedStorage
end

local function ensure(name: string, className: string): Instance
	local existing = EventsFolder:FindFirstChild(name)
	if existing then
		return existing
	end
	local inst = Instance.new(className)
	inst.Name = name
	inst.Parent = EventsFolder
	return inst
end

local Events = {
	MeleeConnect = ensure("MeleeConnect", "RemoteEvent"),
	TakeDamage = ensure("TakeDamage", "RemoteEvent"),
	Objective = ensure("Objective", "RemoteEvent"),
	BossBar = ensure("BossBar", "RemoteEvent"),
	BossSlain = ensure("BossSlain", "RemoteEvent"),
	Callout = ensure("Callout", "RemoteEvent"),
	PlayerPosture = ensure("PlayerPosture", "RemoteEvent"),
	PlayerDamaged = ensure("PlayerDamaged", "RemoteEvent"),
	RiposteReady = ensure("RiposteReady", "RemoteEvent"),
}

return Events
