[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][string]$GodotPath,
 [Parameter(Mandatory=$true)][string]$TemplateDirectory,
 [Parameter(Mandatory=$true)][string]$OutputDirectory,
 [string]$PythonPath = 'python',
 [switch]$SingleFile
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$project = Join-Path $repo 'godot'
$presets = Join-Path $project 'export_presets.cfg'
$outputRoot = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
$original = [IO.File]::ReadAllBytes($presets)
$windowsPreset = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'windows-export.cfg'))
if ($SingleFile) { $windowsPreset = $windowsPreset.Replace('binary_format/embed_pck=false', 'binary_format/embed_pck=true') }
foreach ($kind in @('debug','release')) {
 $template = (Resolve-Path -LiteralPath (Join-Path $TemplateDirectory "windows_${kind}_x86_64.exe")).Path.Replace('\','/')
 $windowsPreset = $windowsPreset.Replace("custom_template/$kind=`"`"", "custom_template/$kind=`"$template`"")
}
try {
 [IO.File]::WriteAllText($presets, [Text.Encoding]::UTF8.GetString($original) + "`n" + $windowsPreset, [Text.UTF8Encoding]::new($false))
 & $GodotPath --headless --path $project --import *> (Join-Path $outputRoot 'import.log')
 if ($LASTEXITCODE -ne 0) { throw 'Godot import failed.' }
 & $GodotPath --headless --path $project --export-release 'Windows Desktop' (Join-Path $outputRoot 'VeloriaFieldnotes.exe') *> (Join-Path $outputRoot 'export.log')
 if ($LASTEXITCODE -ne 0) { throw 'Godot Windows export failed.' }
} finally { [IO.File]::WriteAllBytes($presets, $original) }
& $PythonPath (Join-Path $PSScriptRoot 'windows-assets.py') (Join-Path $outputRoot 'Assets')
if ($LASTEXITCODE -ne 0) { throw 'Icon preparation failed.' }
$licenses = Join-Path $outputRoot 'Licenses'
New-Item -ItemType Directory -Path $licenses -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $project 'fonts/OFL-Galmuri.txt') -Destination $licenses
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Windows-README-KO.txt') -Destination (Join-Path $outputRoot 'README-KO.txt')
Write-Output "Windows x64 game built: $outputRoot"
