$ErrorActionPreference = 'Continue'
$root = (Get-Location).Path
$outDir = Join-Path $root 'assets\candidates'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

$queries = [ordered]@{
  hero           = 'hardware shop shelves'
  'cat-power'    = 'power drill workshop'
  'cat-hand'     = 'tool wall workshop'
  'cat-hardware' = 'hardware shop tools'
  'cat-electrical' = 'electrician tools cables'
  'cat-plumbing' = 'plumber pipes wrench'
  'cat-building' = 'cement bags construction'
  'cat-paint'    = 'painter painting wall'
  'cat-safety'   = 'construction worker safety helmet'
  'cat-fasteners'= 'bolts nuts metal'
  hammer         = 'hammer tool'
  screwdriver    = 'screwdrivers tools'
  extension      = 'power extension cord'
  switch         = 'electrical outlet switch'
  wrench         = 'wrench tool'
  screws         = 'metal screws'
  store          = 'hardware shop shelves'
  tape           = 'retractable tape measure'
  grinder        = 'angle grinder tool'
  fittings       = 'pvc pipe fittings'
}

$manifest = @()
if (Test-Path (Join-Path $outDir 'manifest-retry.json')) {
  $manifest = @(Get-Content (Join-Path $outDir 'manifest-retry.json') -Raw | ConvertFrom-Json)
}

foreach ($key in $queries.Keys) {
  $q = [uri]::EscapeDataString($queries[$key])
  $url = "https://www.pexels.com/search/$q/"
  Write-Host "Searching: $key ($($queries[$key]))"
  $items = $null
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    $html = & curl.exe -s -L --max-time 45 -H "User-Agent: $ua" -H 'Accept: text/html,application/xhtml+xml' -H 'Accept-Language: en-US,en;q=0.9' $url
    $htmlText = $html -join "`n"
    if ($htmlText.Length -lt 10000) {
      Write-Host "  challenge/empty (attempt $attempt), waiting..."
      Start-Sleep -Seconds 20
      continue
    }
    $scriptMatches = [regex]::Matches($htmlText, '<script[^>]*application/ld\+json[^>]*>([\s\S]*?)</script>')
    foreach ($m in $scriptMatches) {
      try {
        $data = $m.Groups[1].Value | ConvertFrom-Json
        if ($data.mainEntity.itemListElement) { $items = $data.mainEntity.itemListElement; break }
      } catch { }
    }
    if ($items) { break }
    Start-Sleep -Seconds 10
  }
  if (-not $items) { Write-Host "  no items parsed"; Start-Sleep -Seconds 5; continue }
  $n = 0
  foreach ($entry in $items) {
    if ($n -ge 4) { break }
    $n++
    $item = $entry.item
    if (-not $item.contentUrl) { continue }
    $file = "r-$key-$n.jpg"
    $dest = Join-Path $outDir $file
    $imgUrl = "$($item.contentUrl)?auto=compress&cs=tinysrgb&w=1100"
    & curl.exe -s -L --max-time 45 -H "User-Agent: $ua" -o $dest $imgUrl
    if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt 5000)) {
      $manifest += [pscustomobject]@{
        key = $key; query = $queries[$key]; file = $file; title = $item.name
        description = $item.description; photographer = $item.creditText
        source = $item.url; licence = 'https://www.pexels.com/license/'
      }
      Write-Host "  saved $file - $($item.name)"
    }
  }
  Start-Sleep -Seconds 8
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $outDir 'manifest-retry.json') -Encoding UTF8
Write-Host "`n$($manifest.Count) retry images total."
