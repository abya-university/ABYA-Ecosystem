# ABYA Ecosystem Docker Development Commands (PowerShell)
# Windows PowerShell compatible development scripts

param(
    [Parameter(Position=0)]
    [ValidateSet("help", "up", "down", "logs", "build", "clean", "restart", "test", "shell", "install")]
    [string]$Command = "help"
)

# Configuration
$ComposeFile = "docker-compose.dev.yml"
$FrontendService = "frontend-dev"

function Show-Help {
    Write-Host "ABYA Ecosystem Docker Development Commands" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\scripts\dev.ps1 <command>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Green
    Write-Host "  up       - Start development environment" -ForegroundColor White
    Write-Host "  down     - Stop development environment" -ForegroundColor White
    Write-Host "  logs     - View development logs" -ForegroundColor White
    Write-Host "  build    - Build development containers" -ForegroundColor White
    Write-Host "  clean    - Clean development environment" -ForegroundColor White
    Write-Host "  restart  - Restart development environment" -ForegroundColor White
    Write-Host "  test     - Run tests in container" -ForegroundColor White
    Write-Host "  shell    - Open shell in frontend container" -ForegroundColor White
    Write-Host "  install  - Install new dependencies" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\scripts\dev.ps1 up" -ForegroundColor Gray
    Write-Host "  .\scripts\dev.ps1 logs" -ForegroundColor Gray
    Write-Host "  .\scripts\dev.ps1 shell" -ForegroundColor Gray
}

function Start-DevEnvironment {
    Write-Host "🚀 Starting ABYA Ecosystem development environment..." -ForegroundColor Green
    
    # Check if Docker is running
    try {
        docker version | Out-Null
    }
    catch {
        Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
    
    # Check if .env file exists
    if (-not (Test-Path ".env")) {
        Write-Host "⚠️  .env file not found. Copying from .env.example..." -ForegroundColor Yellow
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "✅ .env file created. Please configure your environment variables." -ForegroundColor Green
        } else {
            Write-Host "❌ .env.example not found. Please create .env file manually." -ForegroundColor Red
            exit 1
        }
    }
    
    # Start services
    docker-compose -f $ComposeFile up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Development environment started successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Frontend available at: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "🔴 Redis available at: localhost:6379" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Use '.\scripts\dev.ps1 logs' to view logs" -ForegroundColor Yellow
        Write-Host "Use '.\scripts\dev.ps1 down' to stop the environment" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to start development environment" -ForegroundColor Red
        exit 1
    }
}

function Stop-DevEnvironment {
    Write-Host "🛑 Stopping ABYA Ecosystem development environment..." -ForegroundColor Yellow
    docker-compose -f $ComposeFile down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Development environment stopped" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to stop development environment" -ForegroundColor Red
        exit 1
    }
}

function Show-Logs {
    Write-Host "📋 Showing development logs (Ctrl+C to exit)..." -ForegroundColor Cyan
    docker-compose -f $ComposeFile logs -f
}

function Build-Containers {
    Write-Host "🔨 Building development containers..." -ForegroundColor Blue
    docker-compose -f $ComposeFile build --no-cache
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Containers built successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to build containers" -ForegroundColor Red
        exit 1
    }
}

function Clean-Environment {
    Write-Host "🧹 Cleaning development environment..." -ForegroundColor Yellow
    Write-Host "⚠️  This will remove all volumes and cached data!" -ForegroundColor Red
    
    $confirmation = Read-Host "Are you sure? (y/N)"
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        docker-compose -f $ComposeFile down -v
        docker system prune -f
        Write-Host "✅ Environment cleaned" -ForegroundColor Green
    } else {
        Write-Host "❌ Cleanup cancelled" -ForegroundColor Yellow
    }
}

function Restart-Environment {
    Write-Host "🔄 Restarting development environment..." -ForegroundColor Blue
    docker-compose -f $ComposeFile restart
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Environment restarted" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to restart environment" -ForegroundColor Red
        exit 1
    }
}

function Run-Tests {
    Write-Host "🧪 Running tests in container..." -ForegroundColor Magenta
    
    # Check if container is running
    $containerStatus = docker-compose -f $ComposeFile ps -q $FrontendService
    if (-not $containerStatus) {
        Write-Host "❌ Frontend container is not running. Start it first with '.\scripts\dev.ps1 up'" -ForegroundColor Red
        exit 1
    }
    
    docker-compose -f $ComposeFile exec $FrontendService npm test
}

function Open-Shell {
    Write-Host "🐚 Opening shell in frontend container..." -ForegroundColor Cyan
    
    # Check if container is running
    $containerStatus = docker-compose -f $ComposeFile ps -q $FrontendService
    if (-not $containerStatus) {
        Write-Host "❌ Frontend container is not running. Start it first with '.\scripts\dev.ps1 up'" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Type 'exit' to leave the container shell" -ForegroundColor Yellow
    docker-compose -f $ComposeFile exec $FrontendService sh
}

function Install-Dependencies {
    Write-Host "📦 Installing new dependencies..." -ForegroundColor Blue
    
    # Check if container is running
    $containerStatus = docker-compose -f $ComposeFile ps -q $FrontendService
    if (-not $containerStatus) {
        Write-Host "❌ Frontend container is not running. Start it first with '.\scripts\dev.ps1 up'" -ForegroundColor Red
        exit 1
    }
    
    $package = Read-Host "Enter package name to install"
    if ($package) {
        Write-Host "Installing $package..." -ForegroundColor Yellow
        docker-compose -f $ComposeFile exec $FrontendService npm install $package
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Package installed. Restarting container..." -ForegroundColor Green
            docker-compose -f $ComposeFile restart $FrontendService
        } else {
            Write-Host "❌ Failed to install package" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ No package name provided" -ForegroundColor Red
    }
}

# Main command execution
switch ($Command) {
    "help" { Show-Help }
    "up" { Start-DevEnvironment }
    "down" { Stop-DevEnvironment }
    "logs" { Show-Logs }
    "build" { Build-Containers }
    "clean" { Clean-Environment }
    "restart" { Restart-Environment }
    "test" { Run-Tests }
    "shell" { Open-Shell }
    "install" { Install-Dependencies }
    default { 
        Write-Host "❌ Unknown command: $Command" -ForegroundColor Red
        Show-Help
        exit 1
    }
}