$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# If bash is available (Git Bash / WSL), delegate to dev.sh
$bash = Get-Command bash -ErrorAction SilentlyContinue
if ($bash) {
    & bash "$root/dev.sh"
    exit
}

# Native Windows fallback — opens two cmd windows
Write-Host "Starting Dev Digest..." -ForegroundColor Cyan

Start-Process cmd -ArgumentList "/k cd /d `"$root\backend`" && uv run uvicorn app.main:app --reload --port 8000"
Start-Sleep -Seconds 2
Start-Process cmd -ArgumentList "/k cd /d `"$root\frontend`" && npm run dev"

Write-Host ""
Write-Host "Services starting in separate windows:" -ForegroundColor Green
Write-Host "  Backend  -> http://localhost:8000  (docs: http://localhost:8000/docs)" -ForegroundColor Yellow
Write-Host "  Frontend -> http://localhost:3000" -ForegroundColor Yellow
