$ErrorActionPreference = 'Continue'
$root = (Get-Location).Path
$outDir = Join-Path $root 'assets\candidates'
$ua = 'MarowaDemoImageFetcher/1.0 (educational design concept; contact: demo@example.com)'

$queries = [ordered]@{
  hero          = 'hardware store interior'
  'cat-electrical' = 'electrical socket switch'
  extension     = 'extension cord socket'
  screwdriver   = 'screwdriver set'
  'cat-safety'  = 'safety helmet gloves'
  'cat-building'= 'cement bags construction'
  building2     = 'bricks building materials'
  'cat-paint'   = 'paint cans brushes'
  'cat-hand'    = 'hand tools set'
  'cat-hardware'= 'hardware tools'
  'cat-power'   = 'power tools'
  store2        = 'hardware shop'
  cable         = 'electrical cable coil'
  safety2       = 'work gloves'
}

$manifest = @()
foreach ($key in $queries.Keys) {
  $q = 'filetype:bitmap ' + $queries[$key]
  $qEnc = [uri]::EscapeDataString($q)
  $url = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$qEnc&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata&iiurlwidth=1000&format=json"
  Write-Host "Searching: $key ($($queries[$key]))"
  $json = (& curl.exe -s -L --max-time 45 -H "User-Agent: $ua" $url) -join "`n"
  try { $data = $json | ConvertFrom-Json } catch { Write-Host "  parse failed"; continue }
  $pages = $data.query.pages
  if (-not $pages) { Write-Host "  no results"; continue }
  $n = 0
  foreach ($prop in $pages.PSObject.Properties) {
    $page = $prop.Value
    $info = $page.imageinfo[0]
    if (-not $info) { continue }
    $mime = $info.mime
    if ($mime -notmatch 'jpeg|png|webp') { continue }
    $n++
    if ($n -gt 5) { break }
    $file = "w-$key-$n.jpg"
    $dest = Join-Path $outDir $file
    & curl.exe -s -L --max-time 45 -H "User-Agent: $ua" -o $dest $info.thumburl
    if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt 4000)) {
      $artist = $info.extmetadata.Artist.value -replace '<[^>]+>', ''
      $licence = $info.extmetadata.LicenseShortName.value
      $manifest += [pscustomobject]@{
        key = $key; query = $queries[$key]; file = $file; title = $page.title
        description = $info.extmetadata.ImageDescription.value -replace '<[^>]+>', ''
        photographer = $artist; licence = $licence; source = $info.descriptionurl
      }
      Write-Host "  saved $file - $($page.title)"
    }
  }
  Start-Sleep -Milliseconds 700
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $outDir 'manifest-wikimedia.json') -Encoding UTF8
Write-Host "`n$($manifest.Count) Wikimedia images saved."
