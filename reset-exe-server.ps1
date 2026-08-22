param(
  [string]$Root = $PSScriptRoot,
  [int]$PreferredPort = 48741,
  [switch]$Open,
  [switch]$Stop
)

$ErrorActionPreference = "Stop"
$Root = [System.IO.Path]::GetFullPath($Root)
$Root = $Root.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
$AppId = "RESET.EXE-THE-GLITCHED-PHONE"
$PortStart = $PreferredPort
$PortEnd = $PreferredPort + 39
$TokenFile = Join-Path ([System.IO.Path]::GetTempPath()) "reset-exe-server-token.txt"

function New-Token {
  $bytes = New-Object byte[] 24
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes).Replace("+","-").Replace("/","_").TrimEnd("=")
}

function Get-RootHash([string]$value) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($value.ToLowerInvariant())
  return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace("-", "").Substring(0, 16)
}

$RootHash = Get-RootHash $Root

function Invoke-LocalGet([int]$Port, [string]$Path) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    if (-not $async.AsyncWaitHandle.WaitOne(250)) {
      $client.Close()
      return $null
    }
    $client.EndConnect($async)
    $stream = $client.GetStream()
    $stream.ReadTimeout = 300
    $stream.WriteTimeout = 300
    $writer = New-Object System.IO.StreamWriter($stream, [System.Text.Encoding]::ASCII, 1024, $true)
    $writer.NewLine = "`r`n"
    $writer.WriteLine("GET $Path HTTP/1.1")
    $writer.WriteLine("Host: 127.0.0.1:$Port")
    $writer.WriteLine("Connection: close")
    $writer.WriteLine("")
    $writer.Flush()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 8192, $true)
    $response = $reader.ReadToEnd()
    $client.Close()
    return $response
  } catch {
    try { $client.Close() } catch { }
    return $null
  }
}

function Find-ExistingServer {
  for ($port = $PortStart; $port -le $PortEnd; $port++) {
    $response = Invoke-LocalGet $port "/__resetexe/health"
    if ($response -and $response.Contains($AppId) -and $response.Contains($RootHash)) {
      return $port
    }
  }
  return $null
}

function Test-PortFree([int]$Port) {
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
    $listener.Start()
    $listener.Stop()
    return $true
  } catch {
    return $false
  }
}

function Find-FreePort {
  for ($port = $PortStart; $port -le $PortEnd; $port++) {
    if (Test-PortFree $port) {
      return $port
    }
  }
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
  $listener.Start()
  $port = $listener.LocalEndpoint.Port
  $listener.Stop()
  return $port
}

function Get-ContentType([string]$Path) {
  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8"; break }
    ".css" { "text/css; charset=utf-8"; break }
    ".js" { "application/javascript; charset=utf-8"; break }
    ".json" { "application/json; charset=utf-8"; break }
    ".md" { "text/markdown; charset=utf-8"; break }
    ".svg" { "image/svg+xml"; break }
    ".png" { "image/png"; break }
    ".jpg" { "image/jpeg"; break }
    ".jpeg" { "image/jpeg"; break }
    ".ico" { "image/x-icon"; break }
    default { "application/octet-stream" }
  }
}

function Get-QueryValue([string]$Query, [string]$Name) {
  $trimmed = $Query.TrimStart("?")
  if (-not $trimmed) { return $null }
  foreach ($pair in $trimmed.Split("&")) {
    if (-not $pair) { continue }
    $parts = $pair.Split("=", 2)
    $key = [System.Uri]::UnescapeDataString($parts[0])
    if ($key -eq $Name) {
      if ($parts.Length -gt 1) {
        return [System.Uri]::UnescapeDataString($parts[1])
      }
      return ""
    }
  }
  return $null
}

function Send-Response($Client, [int]$Status, [string]$ContentType, [byte[]]$Body) {
  $stream = $Client.GetStream()
  $reason = if ($Status -eq 200) { "OK" } elseif ($Status -eq 404) { "Not Found" } elseif ($Status -eq 403) { "Forbidden" } else { "OK" }
  $header = "HTTP/1.1 $Status $reason`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) {
    $stream.Write($Body, 0, $Body.Length)
  }
  $stream.Flush()
  $Client.Close()
}

function Send-Text($Client, [int]$Status, [string]$ContentType, [string]$Text) {
  Send-Response $Client $Status $ContentType ([System.Text.Encoding]::UTF8.GetBytes($Text))
}

if ($Stop) {
  $stopped = $false
  $token = if (Test-Path $TokenFile) { (Get-Content $TokenFile -Raw).Trim() } else { "" }
  for ($port = $PortStart; $port -le $PortEnd; $port++) {
    $paths = @()
    if ($token) { $paths += "/__resetexe/shutdown?root=$RootHash&token=$token" }
    $paths += "/__resetexe/shutdown?root=$RootHash"
    foreach ($path in $paths) {
      $response = Invoke-LocalGet $port $path
      if ($response -and $response.Contains("RESET.EXE shutdown")) {
        Write-Host "Stopped RESET.EXE server on port $port."
        $stopped = $true
        break
      }
    }
  }
  if (-not $stopped) { Write-Host "No matching RESET.EXE server was running." }
  exit 0
}

$existing = Find-ExistingServer
if ($existing) {
  if ($Open) {
    Start-Process "http://127.0.0.1:$existing/index.html?view=facilitator"
  }
  exit 0
}

$Port = Find-FreePort
$Token = New-Token
Set-Content -Path $TokenFile -Value $Token -Encoding ASCII

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()

if ($Open) {
  Start-Process "http://127.0.0.1:$Port/index.html?view=facilitator"
}

$running = $true
while ($running) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $stream.ReadTimeout = 1000
    $stream.WriteTimeout = 1000
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 8192, $true)
    $requestLine = $reader.ReadLine()
    if (-not $requestLine) {
      $client.Close()
      continue
    }
    $parts = $requestLine.Split(" ")
    $method = $parts[0]
    $rawUrl = if ($parts.Length -gt 1) { $parts[1] } else { "/" }
    while (($line = $reader.ReadLine()) -ne $null -and $line.Length -gt 0) { }

    if ($method -ne "GET" -and $method -ne "HEAD") {
      Send-Text $client 403 "text/plain; charset=utf-8" "Only GET requests are supported."
      continue
    }

    $uri = [System.Uri]::new("http://127.0.0.1:$Port$rawUrl")
    $path = [System.Uri]::UnescapeDataString($uri.AbsolutePath)

    if ($path -eq "/__resetexe/health") {
      Send-Text $client 200 "application/json; charset=utf-8" "{`"app`":`"$AppId`",`"rootHash`":`"$RootHash`",`"port`":$Port}"
      continue
    }

    if ($path -eq "/__resetexe/shutdown") {
      $queryRoot = Get-QueryValue $uri.Query "root"
      $queryToken = Get-QueryValue $uri.Query "token"
      if ($queryRoot -eq $RootHash -and ((-not $queryToken) -or $queryToken -eq $Token)) {
        Send-Text $client 200 "text/plain; charset=utf-8" "RESET.EXE shutdown"
        $running = $false
        continue
      }
      Send-Text $client 403 "text/plain; charset=utf-8" "Shutdown refused."
      continue
    }

    if ($path -eq "/" -or $path -eq "") { $path = "/index.html" }
    $relative = $path.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
    $candidate = [System.IO.Path]::GetFullPath((Join-Path $Root $relative))
    $rootWithSep = $Root + [System.IO.Path]::DirectorySeparatorChar
    if (($candidate -ne $Root) -and (-not $candidate.StartsWith($rootWithSep, [System.StringComparison]::OrdinalIgnoreCase))) {
      Send-Text $client 403 "text/plain; charset=utf-8" "Forbidden"
      continue
    }
    if (-not (Test-Path $candidate -PathType Leaf)) {
      Send-Text $client 404 "text/plain; charset=utf-8" "Not found"
      continue
    }
    $bytes = [System.IO.File]::ReadAllBytes($candidate)
    Send-Response $client 200 (Get-ContentType $candidate) $bytes
  } catch {
    try { Send-Text $client 500 "text/plain; charset=utf-8" "Server error" } catch { }
  }
}

$listener.Stop()
