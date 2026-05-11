# HMS Management Script
# Run from project root: .\hms.ps1 [command]

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

$ProjectRoot = $PSScriptRoot
$BackendRoot = "$ProjectRoot\backend"
$FrontendRoot = "$ProjectRoot\frontend"

$Services = @(
    @{ Name = "patient-service";      Port = 3001 },
    @{ Name = "doctor-service";       Port = 3002 },
    @{ Name = "appointment-service";  Port = 3003 },
    @{ Name = "billing-service";      Port = 3004 },
    @{ Name = "payment-service";      Port = 3005 },
    @{ Name = "prescription-service"; Port = 3006 },
    @{ Name = "notification-service"; Port = 3007 }
)

function Show-Help {
    Write-Host ""
    Write-Host "  HMS Management Script" -ForegroundColor Cyan
    Write-Host "  Usage: .\hms.ps1 [command]" -ForegroundColor White
    Write-Host ""
    Write-Host "  Local Commands:" -ForegroundColor Yellow
    Write-Host "    local:start     Start all backend services + frontend locally"
    Write-Host "    local:stop      Stop all locally running HMS services"
    Write-Host "    local:status    Show which ports are in use"
    Write-Host ""
    Write-Host "  Docker Commands:" -ForegroundColor Yellow
    Write-Host "    docker:start    Start all containers"
    Write-Host "    docker:stop     Stop all containers"
    Write-Host "    docker:restart  Restart all containers"
    Write-Host "    docker:logs     Tail logs from all containers"
    Write-Host "    docker:status   Show container status"
    Write-Host "    docker:rebuild  Rebuild images and restart"
    Write-Host "    docker:reset    Stop + delete volumes + rebuild"
    Write-Host ""
}

function Start-LocalServices {
    Write-Host "`n Starting HMS services locally..." -ForegroundColor Cyan
    foreach ($svc in $Services) {
        $path = "$BackendRoot\$($svc.Name)"
        if (!(Test-Path $path)) {
            Write-Host "  [SKIP] $($svc.Name)" -ForegroundColor DarkGray
            continue
        }
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$path'; npm start" -WindowStyle Normal
        Write-Host "  [UP]   $($svc.Name) on port $($svc.Port)" -ForegroundColor Green
        Start-Sleep -Milliseconds 300
    }
    Write-Host "`n Starting Angular frontend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendRoot'; npx ng serve" -WindowStyle Normal
    Write-Host "  [UP]   frontend on http://localhost:4200" -ForegroundColor Green
    Write-Host "`n All services started. Open http://localhost:4200`n" -ForegroundColor Cyan
}

function Stop-LocalServices {
    Write-Host "`n Stopping local HMS services..." -ForegroundColor Yellow
    $ports = ($Services | ForEach-Object { $_.Port }) + 4200
    foreach ($port in $ports) {
        $pid = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
        if ($pid) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  [STOPPED] port $port (PID $pid)" -ForegroundColor Red
        } else {
            Write-Host "  [IDLE]    port $port" -ForegroundColor DarkGray
        }
    }
    Write-Host ""
}

function Show-LocalStatus {
    Write-Host "`n HMS Local Port Status:" -ForegroundColor Cyan
    $allPorts = $Services + @(@{ Name = "frontend"; Port = 4200 })
    foreach ($svc in $allPorts) {
        $conn = Get-NetTCPConnection -LocalPort $svc.Port -State Listen -ErrorAction SilentlyContinue
        if ($conn) {
            Write-Host "  [RUNNING] $($svc.Name) - port $($svc.Port)" -ForegroundColor Green
        } else {
            Write-Host "  [STOPPED] $($svc.Name) - port $($svc.Port)" -ForegroundColor DarkGray
        }
    }
    Write-Host ""
}

function Start-Docker {
    Write-Host "`n Starting Docker containers..." -ForegroundColor Cyan
    Set-Location $ProjectRoot
    docker-compose up -d
    Write-Host "`n Containers started. Open http://localhost:4200`n" -ForegroundColor Green
}

function Stop-Docker {
    Write-Host "`n Stopping Docker containers..." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    docker-compose down
    Write-Host " Done.`n" -ForegroundColor Green
}

function Restart-Docker {
    Write-Host "`n Restarting Docker containers..." -ForegroundColor Cyan
    Set-Location $ProjectRoot
    docker-compose restart
    Write-Host " Done.`n" -ForegroundColor Green
}

function Show-DockerLogs {
    Set-Location $ProjectRoot
    docker-compose logs -f
}

function Show-DockerStatus {
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

function Rebuild-Docker {
    Write-Host "`n Rebuilding and restarting Docker containers..." -ForegroundColor Cyan
    Set-Location $ProjectRoot
    docker-compose up --build -d
    Write-Host "`n Done. Open http://localhost:4200`n" -ForegroundColor Green
}

function Reset-Docker {
    Write-Host "`n WARNING: This will delete all Docker volumes and data!" -ForegroundColor Red
    $confirm = Read-Host "Type YES to continue"
    if ($confirm -ne "YES") { Write-Host "Aborted.`n"; return }
    Set-Location $ProjectRoot
    docker-compose down -v
    docker-compose up --build -d
    Write-Host "`n Reset complete. Remember to re-run seed commands.`n" -ForegroundColor Yellow
}

switch ($Command) {
    "local:start"    { Start-LocalServices }
    "local:stop"     { Stop-LocalServices }
    "local:status"   { Show-LocalStatus }
    "docker:start"   { Start-Docker }
    "docker:stop"    { Stop-Docker }
    "docker:restart" { Restart-Docker }
    "docker:logs"    { Show-DockerLogs }
    "docker:status"  { Show-DockerStatus }
    "docker:rebuild" { Rebuild-Docker }
    "docker:reset"   { Reset-Docker }
    default          { Show-Help }
}
