Add-Type -AssemblyName System.Drawing

$cand = Join-Path (Get-Location) 'assets\candidates'
$imgRoot = Join-Path (Get-Location) 'assets\img'
$prodDir = Join-Path $imgRoot 'products'
$catDir = Join-Path $imgRoot 'categories'
New-Item -ItemType Directory -Force -Path $prodDir, $catDir | Out-Null

function Save-CroppedJpeg([string]$source, [string]$dest, [int]$targetW, [int]$targetH, [int]$quality = 84) {
  $srcPath = Join-Path $cand $source
  if (-not (Test-Path $srcPath)) { Write-Host "MISSING $source"; return }
  $image = [System.Drawing.Image]::FromFile($srcPath)
  try {
    $bitmap = New-Object System.Drawing.Bitmap $targetW, $targetH
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $srcRatio = $image.Width / $image.Height
    $dstRatio = $targetW / $targetH
    if ($srcRatio -gt $dstRatio) {
      $cropH = $image.Height
      $cropW = [int]($cropH * $dstRatio)
    } else {
      $cropW = $image.Width
      $cropH = [int]($cropW / $dstRatio)
    }
    $sx = [int](($image.Width - $cropW) / 2)
    $sy = [int](($image.Height - $cropH) / 2)
    $graphics.DrawImage($image, (New-Object System.Drawing.Rectangle 0, 0, $targetW, $targetH), (New-Object System.Drawing.Rectangle $sx, $sy, $cropW, $cropH), [System.Drawing.GraphicsUnit]::Pixel)
    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $params = [System.Drawing.Imaging.EncoderParameters]::new(1)
    $params.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
    $bitmap.Save($dest, $encoder, $params)
    $graphics.Dispose(); $bitmap.Dispose()
  } finally {
    $image.Dispose()
  }
}

# Product photography — 4:3
$products = [ordered]@{
  'cordless-drill'   = 'drill-1.jpg'
  'angle-grinder'    = 'grinder-1.jpg'
  'impact-drill'     = 'drill-4.jpg'
  'tape-measure'     = 'x-tape2-2.jpg'
  'claw-hammer'      = 'x-hammer2-2.jpg'
  'screwdriver-set'  = 'w-screwdriver-1.jpg'
  'adjustable-spanner' = 'x-spanner-2.jpg'
  'spanner-set'      = 'r-wrench-3.jpg'
  'tool-kit'         = 'w-cat-hand-3.jpg'
  'extension-lead'   = 'w-extension-5.jpg'
  'light-switch'     = 'w-cat-electrical-4.jpg'
  'electrical-cable' = 'w-cable-2.jpg'
  'pvc-pipe'         = 'pvc-1.jpg'
  'pvc-elbow'        = 'x-fittings2-1.jpg'
  'pvc-fittings'     = 'x-fittings2-5.jpg'
  'cement'           = 'w-cat-building-2.jpg'
  'bricks'           = 'w-building2-4.jpg'
  'masonry-blocks'   = 'w-building2-5.jpg'
  'paint-roller'     = 'roller-1.jpg'
  'roller-kit'       = 'roller-4.jpg'
  'emulsion-paint'   = 'roller-5.jpg'
  'safety-helmet'    = 'x-safetyhelmet-1.jpg'
  'work-gloves'      = 'w-safety2-2.jpg'
  'wood-screws'      = 'r-screws-3.jpg'
  'hex-bolts'        = 'r-screws-4.jpg'
}
foreach ($name in $products.Keys) {
  Save-CroppedJpeg $products[$name] (Join-Path $prodDir "$name.jpg") 900 675 84
  Write-Host "product $name"
}

# Category imagery — 4:3
$categories = [ordered]@{
  'power-tools'        = 'drill-1.jpg'
  'hand-tools'         = 'w-cat-hand-2.jpg'
  'hardware'           = 'r-wrench-3.jpg'
  'electrical-supplies'= 'w-cable-2.jpg'
  'plumbing'           = 'pvc-1.jpg'
  'building-materials' = 'w-cat-building-2.jpg'
  'paint-finishing'    = 'roller-5.jpg'
  'safety-equipment'   = 'x-safetyhelmet-1.jpg'
  'fasteners-fittings' = 'r-screws-4.jpg'
}
foreach ($name in $categories.Keys) {
  Save-CroppedJpeg $categories[$name] (Join-Path $catDir "$name.jpg") 800 600 84
  Write-Host "category $name"
}

# Hero and editorial photography
Save-CroppedJpeg 'hero-large.jpg' (Join-Path $imgRoot 'hero-grinder.jpg') 1800 1180 86
Save-CroppedJpeg 'w-store2-4.jpg' (Join-Path $imgRoot 'store-interior.jpg') 1200 900 84
Write-Host 'hero + store done'

Get-ChildItem -Recurse $imgRoot -File | Select-Object FullName, Length | Format-Table -AutoSize
