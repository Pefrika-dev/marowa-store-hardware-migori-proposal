Add-Type -AssemblyName System.Drawing
$dir = Join-Path (Get-Location) 'assets\candidates'
$images = Get-ChildItem -Path $dir -Filter '*.jpg' | Sort-Object Name
$cols = 5
$cellW = 300
$cellH = 240
$labelH = 28
$rows = [math]::Ceiling($images.Count / $cols)
$sheet = New-Object System.Drawing.Bitmap ($cols * $cellW), ($rows * ($cellH + $labelH))
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::FromArgb(245, 244, 240))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$font = New-Object System.Drawing.Font('Consolas', 11)
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(20, 24, 28))
$i = 0
foreach ($img in $images) {
  $col = $i % $cols
  $row = [math]::Floor($i / $cols)
  $x = $col * $cellW
  $y = $row * ($cellH + $labelH)
  try {
    $bitmap = [System.Drawing.Image]::FromFile($img.FullName)
    $scale = [math]::Max(($cellW - 8) / $bitmap.Width, ($cellH - 8) / $bitmap.Height)
    $w = [int]($bitmap.Width * $scale)
    $h = [int]($bitmap.Height * $scale)
    $dx = $x + [int](($cellW - $w) / 2)
    $dy = $y + [int](($cellH - $h) / 2)
    $g.DrawImage($bitmap, $dx, $dy, $w, $h)
    $bitmap.Dispose()
  } catch { }
  $g.DrawString($img.Name, $font, $brush, $x + 6, $y + $cellH + 4)
  $i++
}
$out = Join-Path $dir 'contact-sheet.jpg'
$sheet.Save($out, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$g.Dispose(); $sheet.Dispose()
Write-Host "saved $out"
