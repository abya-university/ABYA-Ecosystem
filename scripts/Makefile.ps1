# ABYA Ecosystem Docker Development Commands (PowerShell Makefile Alternative)
# Use this instead of traditional Makefile on Windows

# Default help target
function Show-MakeHelp {
    Write-Host "ABYA Ecosystem Docker Development Commands" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "PowerShell Commands (use these instead of make):" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Development:" -ForegroundColor Green
    Write-Host "  .\scripts\dev.ps1 up         - Start development environment" -ForegroundColor White
    Write-Host "  .\scripts\dev.ps1 down       - Stop development environment" -ForegroundColor White
    Write-Host "  .\scripts\dev.ps1 logs       - View development logs" -ForegroundColor White
    Write-Host "  .\scripts\dev.ps1 build      - Build development containers" -ForegroundColor White
    Write-Host "  .\scripts\dev.ps1 clean      - Clean development environment" -ForegroundColor White
    Write-Host "  .\scripts\dev.ps1 restart    - Restart development environment" -ForegroundColor White
    Write-Host ""
    Write-Host "Testing & Debugging:" -ForegroundColor Green
    Write-Host "  .\scripts\dev.ps1 test       - Run tests in container" -ForegroundColor White
    Write-Host "  .\scripts\dev.ps1 shell      - Open shell in frontend container" -ForegroundColor White
    Write-Host "  .\scripts\healthcheck.ps1    - Run health checks" -ForegroundColor White
    Write-Host ""
    Write-Host "Package Management:" -ForegroundColor Green
    Write-Host "  .\scripts\dev.ps1 install    - Install new dependencies" -ForegroundColor White
    Write-Host ""
    Write-Host "Production:" -ForegroundColor Green
    Write-Host "  docker-compose up -d         - Start production environment" -ForegroundColor White
    Write-Host "  docker-compose down          - Stop production environment" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternative: Use the traditional make commands if you have make installed:" -ForegroundColor Yellow
    Write-Host "  make dev-up, make dev-down, make dev-logs, etc." -ForegroundColor Gray
}

# Export the function so it can be called
Show-MakeHelp