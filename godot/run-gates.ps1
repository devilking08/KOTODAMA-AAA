# KOTODAMA Godot build gates.
# Gates on log content (SCRIPT ERROR / parse failures) per the godogen guide —
# headless exit codes are unreliable because benign RID/ObjectDB leaks print
# ERROR lines at exit.
# Usage: powershell -File run-gates.ps1 [-Godot path]
param(
  [string]$Godot = "D:\tools\godot\Godot_v4.7.2-stable_win64.exe"
)
$ErrorActionPreference = "Stop"
if (-not (Test-Path $Godot)) { Write-Error "Godot not found at $Godot" }

$proj = "D:\kotodama_godot"

function Run-Godot([string[]]$argsList, [string]$label, [switch]$RequireExit) {
  Write-Host "== $label =="
  $out = & $Godot --headless --path $proj @argsList 2>&1
  $text = ($out | Out-String)
  # Case-insensitive: Godot logs "Parse error" (lowercase) for a directly
  # loaded broken script, and "SCRIPT ERROR: Parse Error:" for dependent
  # loads. Match both, plus load/API failures that otherwise slip through.
  if ($text -match '(?i)SCRIPT ERROR|Parse error|Failed to load (script|resource)|Cannot open file|Invalid call|Attempt to call') {
    Write-Host $text
    throw "$label reported errors"
  }
  if ($RequireExit -and $LASTEXITCODE -ne 0) {
    Write-Host $text
    throw "$label exited with code $LASTEXITCODE"
  }
  Write-Host "ok"
}

Run-Godot @("--import") "1/5 import"
Run-Godot @("--script", "res://test/check_scripts.gd") "2/5 load all scripts"
Run-Godot @("--script", "res://scenes/build_main.gd") "3/5 build main scene"
foreach ($s in @("Terrain","Player","Enemy","Game","HUD")) {
  Run-Godot @("--check-only", "--script", "res://scripts/$s.gd") "3/4 check $s"
}
Run-Godot @("--quit-after", "30") "5/5 headless smoke"
Run-Godot @("--script", "res://test/verify_scene.gd") "5.5/5 scene script integrity"
Run-Godot @("--script", "res://test/smoke_scene.gd") "5.75/5 runtime smoke v3 (exit code)" -RequireExit

Write-Host "ALL GATES PASSED"
