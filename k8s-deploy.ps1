# HMS Minikube Deploy Script
# Run from project root: .\k8s-deploy.ps1 setup

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    [Parameter(Position=1)]
    [string]$ServiceName = ""
)

$ProjectRoot = $PSScriptRoot
$K8sDir = "$ProjectRoot\k8s"

$Services = @(
    "patient-service",
    "doctor-service",
    "appointment-service",
    "billing-service",
    "payment-service",
    "prescription-service",
    "notification-service"
)

function Show-Help {
    Write-Host ""
    Write-Host "  HMS Kubernetes Deploy Script" -ForegroundColor Cyan
    Write-Host "  Usage: .\k8s-deploy.ps1 [command]" -ForegroundColor White
    Write-Host ""
    Write-Host "  Commands:" -ForegroundColor Yellow
    Write-Host "    setup      Start Minikube + build images + deploy everything"
    Write-Host "    build      Build all Docker images into Minikube"
    Write-Host "    deploy     Apply all Kubernetes manifests"
    Write-Host "    status     Show pods and services"
    Write-Host "    open       Open the app in browser"
    Write-Host "    teardown   Delete all HMS resources from Kubernetes"
    Write-Host "    stop       Stop Minikube"
    Write-Host ""
}

function Start-Minikube {
    Write-Host "`n Checking Minikube..." -ForegroundColor Cyan
    $mkStatus = minikube status 2>&1
    if ($mkStatus -notmatch "Running") {
        Write-Host " Starting Minikube..." -ForegroundColor Yellow
        minikube start --driver=docker --memory=4096 --cpus=4
    } else {
        Write-Host " Minikube already running." -ForegroundColor Green
    }
    Write-Host " Enabling Ingress addon..." -ForegroundColor Cyan
    minikube addons enable ingress
}

function Build-Images {
    Write-Host "`n Building Docker images inside Minikube..." -ForegroundColor Cyan

    $envVars = minikube docker-env --shell=powershell 2>&1
    foreach ($line in $envVars) {
        if ($line -match '^\$Env:(\w+)\s*=\s*"(.+)"') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }

    foreach ($svc in $Services) {
        $path = "$ProjectRoot\backend\$svc"
        Write-Host "  Building hms/$svc..." -ForegroundColor Yellow
        docker build -t "hms/$($svc):latest" $path
    }

    Write-Host "  Building hms/frontend..." -ForegroundColor Yellow
    docker build -t "hms/frontend:latest" "$ProjectRoot\frontend"
    Write-Host "`n All images built." -ForegroundColor Green
}

function Deploy-All {
    Write-Host "`n Applying Kubernetes manifests..." -ForegroundColor Cyan
    kubectl apply -f "$K8sDir\namespace.yaml"
    kubectl apply -f "$K8sDir\secret.yaml"
    kubectl apply -f "$K8sDir\configmap.yaml"
    Write-Host "  Deploying databases..." -ForegroundColor Yellow
    kubectl apply -f "$K8sDir\databases"
    Write-Host "  Waiting 20s for databases to initialise..." -ForegroundColor Yellow
    Start-Sleep -Seconds 20
    Write-Host "  Deploying microservices..." -ForegroundColor Yellow
    kubectl apply -f "$K8sDir\services"
    Write-Host "  Deploying frontend..." -ForegroundColor Yellow
    kubectl apply -f "$K8sDir\frontend.yaml"
    Write-Host "  Applying Ingress..." -ForegroundColor Yellow
    kubectl apply -f "$K8sDir\ingress.yaml"
    Write-Host "`n Deployment complete." -ForegroundColor Green
}

function Show-Status {
    Write-Host "`n Pods:" -ForegroundColor Cyan
    kubectl get pods -n hms
    Write-Host "`n Services:" -ForegroundColor Cyan
    kubectl get services -n hms
    Write-Host "`n Ingress:" -ForegroundColor Cyan
    kubectl get ingress -n hms
}

function Open-App {
    Write-Host "`n Getting Minikube service URL..." -ForegroundColor Cyan
    minikube service frontend -n hms --url
}

function Show-Logs {
    if ($ServiceName -eq "") {
        Write-Host "Usage: .\k8s-deploy.ps1 logs patient-service" -ForegroundColor Red
        return
    }
    kubectl logs -n hms -l "app=$ServiceName" -f --tail=100
}

function Remove-All {
    Write-Host "`n Removing all HMS resources..." -ForegroundColor Red
    kubectl delete namespace hms
    Write-Host " Done.`n" -ForegroundColor Green
}

function Stop-Minikube {
    Write-Host "`n Stopping Minikube..." -ForegroundColor Yellow
    minikube stop
    Write-Host " Done.`n" -ForegroundColor Green
}

function Full-Setup {
    Start-Minikube
    Build-Images
    Deploy-All
    Write-Host "`n Setup complete!" -ForegroundColor Green
    Write-Host " Run: .\k8s-deploy.ps1 status" -ForegroundColor DarkGray
    Write-Host " Run: .\k8s-deploy.ps1 open`n" -ForegroundColor DarkGray
}

switch ($Command) {
    "setup"    { Full-Setup }
    "build"    { Build-Images }
    "deploy"   { Deploy-All }
    "status"   { Show-Status }
    "open"     { Open-App }
    "logs"     { Show-Logs }
    "teardown" { Remove-All }
    "stop"     { Stop-Minikube }
    default    { Show-Help }
}
