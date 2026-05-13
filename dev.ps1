param(
    [ValidateSet("start", "stop")]
    [string]$Action = "start"
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($Action -eq "stop") {
    Write-Host "Stopping Dev Digest..." -ForegroundColor Cyan

    Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "  Backend stopped." -ForegroundColor Yellow

    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    # Also kill any process holding port 3000 (Next.js long-running dev server)
    $port3000 = netstat -ano | Select-String ":3000 " | ForEach-Object { ($_ -split "\s+")[-1] } | Select-Object -First 1
    if ($port3000) { taskkill /PID $port3000 /F 2>$null | Out-Null }
    Write-Host "  Frontend stopped." -ForegroundColor Yellow

    Write-Host "Done." -ForegroundColor Green
    exit
}

# start
Write-Host "Starting Dev Digest..." -ForegroundColor Cyan

Start-Process cmd -ArgumentList "/k cd /d `"$root\backend`" && uv run uvicorn app.main:app --reload --port 8000"
Start-Sleep -Seconds 2
Start-Process cmd -ArgumentList "/k cd /d `"$root\frontend`" && npm run dev"

Write-Host ""
Write-Host "Services starting in separate windows:" -ForegroundColor Green
Write-Host "  Backend  -> http://localhost:8000  (docs: http://localhost:8000/docs)" -ForegroundColor Yellow
Write-Host "  Frontend -> http://localhost:3000" -ForegroundColor Yellow
