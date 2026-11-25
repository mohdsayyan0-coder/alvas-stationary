# Zero-dependency PowerShell HTTP server (works on PC + Phone on same Wi-Fi, no Admin required)
param(
  [int]$Port = 8080
)

$Root = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$Listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
$Listener.Start()

$LanIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.InterfaceAlias -notmatch 'vEthernet|Loopback' } |
  Select-Object -First 1 -ExpandProperty IPAddress)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Alva's Institute of Engineering and Technology — Server  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " PC Link    : http://localhost:$Port/" -ForegroundColor Green
if ($LanIp) {
  Write-Host " Phone Link : http://${LanIp}:$Port/  (same Wi-Fi)" -ForegroundColor Yellow
  Write-Host " Customer   : http://${LanIp}:$Port/#customer" -ForegroundColor Yellow
  Write-Host " Shopkeeper : http://${LanIp}:$Port/#shopkeeper" -ForegroundColor Yellow
} else {
  Write-Host " Phone Link : Connect to Wi-Fi and use http://<PC-IPv4>:$Port/" -ForegroundColor Yellow
}
Write-Host " Press Ctrl+C to stop." -ForegroundColor DarkGray

$MimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".json" = "application/json; charset=utf-8"
}

try {
  while ($true) {
    $Client = $Listener.AcceptTcpClient()
    try {
      $Stream = $Client.GetStream()
      $Reader = New-Object System.IO.StreamReader($Stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $RequestLine = $Reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($RequestLine)) {
        $Client.Close()
        continue
      }
      while ($true) {
        $HeaderLine = $Reader.ReadLine()
        if ([string]::IsNullOrEmpty($HeaderLine)) { break }
      }

      $Parts = $RequestLine.Split(' ')
      $RawPath = if ($Parts.Length -ge 2) { $Parts[1] } else { "/" }
      $CleanPath = ($RawPath.Split('?')[0]).TrimStart('/')
      if ([string]::IsNullOrWhiteSpace($CleanPath)) { $CleanPath = "index.html" }
      $CleanPath = [Uri]::UnescapeDataString($CleanPath).Replace('/', [System.IO.Path]::DirectorySeparatorChar)

      $FullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $CleanPath))
      if (-not $FullPath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $FullPath -PathType Leaf)) {
        $NotFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $Header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($NotFound.Length)`r`nConnection: close`r`n`r`n"
        $HeaderBytes = [System.Text.Encoding]::ASCII.GetBytes($Header)
        $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
        $Stream.Write($NotFound, 0, $NotFound.Length)
      } else {
        $Ext = [System.IO.Path]::GetExtension($FullPath).ToLowerInvariant()
        $ContentType = if ($MimeTypes.ContainsKey($Ext)) { $MimeTypes[$Ext] } else { "application/octet-stream" }
        $Body = [System.IO.File]::ReadAllBytes($FullPath)
        $Header = "HTTP/1.1 200 OK`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
        $HeaderBytes = [System.Text.Encoding]::ASCII.GetBytes($Header)
        $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
        $Stream.Write($Body, 0, $Body.Length)
      }
    } catch {
      # Ignore broken client sockets
    } finally {
      $Client.Close()
    }
  }
} finally {
  $Listener.Stop()
}
