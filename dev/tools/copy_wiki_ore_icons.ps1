$ErrorActionPreference = 'Stop'
$Root = (Get-Location).Path
$Dest = Join-Path $Root 'wiki_assets\ore_icons'
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

@(
  'alluminum_ore',
  'tin_ore',
  'stardust_ore',
  'deepslate_stardust_ore',
  'corstinite_ore',
  'ender_ore'
) | ForEach-Object {
  Copy-Item -Force `
    -Path (Join-Path $Root "BOB_resources\textures\blocks\ores\$_.png") `
    -Destination (Join-Path $Dest "$_.png")
}
