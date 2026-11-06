--!strict
-- Bootstrap: single server entry point. Everything else is required from
-- here so the world, enemies, boss and combat resolve in one pass.

local EnemyDirector = require(script.Parent.EnemyDirector)
return EnemyDirector
