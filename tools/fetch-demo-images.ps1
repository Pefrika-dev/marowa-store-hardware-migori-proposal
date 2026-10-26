$ErrorActionPreference = 'Continue'
$root = (Get-Location).Path
$outDir = Join-Path $root 'assets\candidates'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$queries = [ordered]@{
  hero           = 'hardware store tools'
  'cat-power'    = 'power tools workshop'
  'cat-hand'     = 'hand tools workbench'
  'cat-hardware' = 'hardware tools assortment'
  'cat-electrical' = 'electrical supplies cables'
  'cat-plumbing' = 'plumbing pipes fittings'
  'cat-building' = 'building materials construction'
  'cat-paint'    = 'paint roller painting'
  'cat-safety'   = 'safety equipment helmet gloves'
  'cat-fasteners'= 'screws bolts fasteners'
  drill          = 'cordless drill'
  grinder        = 'angle grinder'
  tape           = 'measuring tape'
  hammer         = 'claw hammer'
  screwdriver    = 'screwdriver set'
  extension      = 'extension cord cable'
  switch         = 'light switch socket'
  pvc            = 'pvc pipe'
  fittings       = 'pipe fittings'
  roller         = 'paint roller'
  wrench         = 'adjustable wrench'
  screws         = 'construction screws'
  store          = 'hardware store interior'
}

$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36'
$manifest = @()

foreach ($key in $queries.Keys) {
  $q = [uri]::EscapeDataString($queries[$key])
  $url = "https://www.pexels.com/search/$q/"
  Write-Host "Searching: $key ($($queries[$key]))"
  $html = & curl.exe -s -L --max-time 40 -H "User-Agent: $ua" -H 'Accept: text/html,application/xhtml+xml' $url
  if (-not $html) { Write-Host "  empty response"; continue }
  $htmlText = $html -join "`n"
  $scriptMatches = [regex]::Matches($htmlText, '<script[^>]*application/ld\+json[^>]*>([\s\S]*?)</script>')
  $items = $null
  foreach ($m in $scriptMatches) {
    try {
      $data = $m.Groups[1].Value | ConvertFrom-Json
      if ($data.mainEntity.itemListElement) { $items = $data.mainEntity.itemListElement; break }
    } catch { }
  }
  if (-not $items) { Write-Host "  no items parsed"; continue }
  $n = 0
  foreach ($entry in $items) {
    if ($n -ge 5) { break }
    $n++
    $item = $entry.item
    if (-not $item.contentUrl) { continue }
    $file = "$key-$n.jpg"
    $dest = Join-Path $outDir $file
    $imgUrl = "$($item.contentUrl)?auto=compress&cs=tinysrgb&w=1100"
    & curl.exe -s -L --max-time 40 -H "User-Agent: $ua" -o $dest $imgUrl
    if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt 5000)) {
      $manifest += [pscustomobject]@{
        key = $key
        query = $queries[$key]
        file = $file
        title = $item.name
        description = $item.description
        photographer = $item.creditText
        source = $item.url
        licence = 'https://www.pexels.com/license/'
      }
      Write-Host "  saved $file - $($item.name)"
    }
  }
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $outDir 'manifest.json') -Encoding UTF8
Write-Host "`n$($manifest.Count) images saved."
