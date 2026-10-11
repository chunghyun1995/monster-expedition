[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$GameDirectory,
  [Parameter(Mandatory=$true)][string]$OutputDirectory,
  [Parameter(Mandatory=$true)][string]$IdentityName,
  [Parameter(Mandatory=$true)][string]$Publisher,
  [Parameter(Mandatory=$true)][string]$PublisherDisplayName,
  [string]$DisplayName = '벨로리아 생태기록',
  [string]$Version = '4.0.1.0',
  [string]$MakeAppxPath = 'makeappx.exe',
  [switch]$Preview
)
$ErrorActionPreference = 'Stop'
if ($IdentityName -notmatch '^[A-Za-z0-9][A-Za-z0-9.-]{2,49}$') { throw 'Invalid Package/Identity/Name.' }
if (-not $Publisher.StartsWith('CN=')) { throw 'Use the exact Package/Identity/Publisher from Partner Center.' }
if ($Version -notmatch '^\d+\.\d+\.\d+\.0$') { throw 'Store package version must have four components and end in .0.' }
foreach ($part in $Version.Split('.')) { if ([int]$part -gt 65535) { throw 'Version component exceeds 65535.' } }
if (-not $Preview -and ($Publisher -match 'Preview|Placeholder|REPLACE' -or $IdentityName -match 'Preview|Placeholder|REPLACE')) { throw 'Preview/placeholder identities are not Store submission identities.' }
$gameRoot = (Resolve-Path -LiteralPath $GameDirectory).Path
$outputRoot = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
$stage = Join-Path $outputRoot ('stage-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stage | Out-Null
foreach ($name in @('VeloriaFieldnotes.exe','VeloriaFieldnotes.pck')) {
  $file = Join-Path $gameRoot $name
  if (-not (Test-Path -LiteralPath $file)) { throw "Missing game payload: $name" }
  Copy-Item -LiteralPath $file -Destination $stage
}
if (-not (Test-Path -LiteralPath (Join-Path $gameRoot 'Assets/StoreLogo.png'))) { throw 'Missing MSIX Assets; run windows-assets.py first.' }
Copy-Item -LiteralPath (Join-Path $gameRoot 'Assets') -Destination $stage -Recurse
if (Test-Path -LiteralPath (Join-Path $gameRoot 'Licenses')) { Copy-Item -LiteralPath (Join-Path $gameRoot 'Licenses') -Destination $stage -Recurse }
function XmlValue([string]$value) { return [Security.SecurityElement]::Escape($value) }
$identity = XmlValue $IdentityName
$publisherValue = XmlValue $Publisher
$publisherLabel = XmlValue $PublisherDisplayName
$display = XmlValue $DisplayName
$manifest = @"
<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
 xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
 xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
 IgnorableNamespaces="uap rescap">
 <Identity Name="$identity" Publisher="$publisherValue" Version="$Version" ProcessorArchitecture="x64" />
 <Properties><DisplayName>$display</DisplayName><PublisherDisplayName>$publisherLabel</PublisherDisplayName><Description>$display</Description><Logo>Assets\StoreLogo.png</Logo></Properties>
 <Dependencies><TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.26100.0" /></Dependencies>
 <Resources><Resource Language="ko-kr" /><Resource Language="en-us" /></Resources>
 <Applications><Application Id="Game" Executable="VeloriaFieldnotes.exe" EntryPoint="Windows.FullTrustApplication">
  <uap:VisualElements DisplayName="$display" Description="$display" BackgroundColor="#14252C" Square150x150Logo="Assets\Square150x150Logo.png" Square44x44Logo="Assets\Square44x44Logo.png" />
 </Application></Applications>
 <Capabilities><rescap:Capability Name="runFullTrust" /></Capabilities>
</Package>
"@
[IO.File]::WriteAllText((Join-Path $stage 'AppxManifest.xml'), $manifest, [Text.UTF8Encoding]::new($false))
$suffix = if ($Preview) { '-PREVIEW-IDENTITY-REQUIRED' } else { '-STORE' }
$package = Join-Path $outputRoot "VeloriaFieldnotes-$Version-x64$suffix.msix"
& $MakeAppxPath pack /d $stage /p $package /o
if ($LASTEXITCODE -ne 0) { throw "MakeAppx validation failed: $LASTEXITCODE" }
$record = [ordered]@{Package=$package;IdentityName=$IdentityName;Publisher=$Publisher;PublisherDisplayName=$PublisherDisplayName;Version=$Version;Preview=[bool]$Preview;StoreIdentityConfirmed=(-not $Preview);Signed=$false;SHA256=(Get-FileHash -LiteralPath $package -Algorithm SHA256).Hash}
$record | ConvertTo-Json | Set-Content -LiteralPath ($package+'.json') -Encoding utf8
Write-Output "Created unsigned MSIX: $package"
if ($Preview) { Write-Warning 'Preview identity only: do not upload this package to Partner Center. Repack with your reserved product identity.' }
