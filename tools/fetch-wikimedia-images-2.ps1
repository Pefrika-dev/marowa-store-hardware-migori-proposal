$ErrorActionPreference = 'Continue'
$root = (Get-Location).Path
$outDir = Join-Path $root 'assets\candidates'
$ua = 'MarowaDemoImageFetcher/1.0 (educational design concept)'
$queries = [ordered]@{
  tape2 = 'tape measure'
  fittings2 = 'pvc fittings'
  spanner = 'adjustable spanner'
  hammer2 = 'claw hammer'
  safetyhelmet = 'hard hat'
  cement = 'cement bags'
  drill2 = 'cordless drill'
}
$manifest = @()
foreach ($key in $queries.Keys) {
  $q = [uri]::EscapeDataString('filetype:bitmap ' + $queries[$key])
  $url = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$q&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata&iiurlwidth=1000&format=json"
  Write-Host "Searching: $key"
  $json = (& curl.exe -s -L --max-time 45 -H "User-Agent: $ua" $url) -join "`n"
  try { $data = $json | ConvertFrom-Json } catch { continue }
  if (-not $data.query.pages) { continue }
  $n = 0
  foreach ($prop in $data.query.pages.PSObject.Properties) {
    $page = $prop.Value; $info = $page.imageinfo[0]
    if (-not $info -or $info.mime -notmatch 'jpeg|png') { continue }
    $n++; if ($n -gt 5) { break }
    $file = "x-$key-$n.jpg"; $dest = Join-Path $outDir $file
    & curl.exe -s -L --max-time 45 -H "User-Agent: $ua" -o $dest $info.thumburl
    if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt 4000)) {
      $manifest += [pscustomobject]@{ key=$key; file=$file; title=$page.title; source=$info.descriptionurl; licence=$info.extmetadata.LicenseShortName.value; photographer=($info.extmetadata.Artist.value -replace '<[^>]+>','') }
      Write-Host "  $file - $($page.title)"
    }
  }
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $outDir 'manifest-wikimedia-2.json') -Encoding UTF8
