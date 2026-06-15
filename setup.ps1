# setup.ps1 — prepara uma máquina Windows para rodar o Capivara Companheira.
#
# Uso (PowerShell):
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1              # caminho rápido (Node)
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1 -ComDocker   # + Docker Desktop (Dev Container)
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1 -ComDocker -ComVSCode   # + VS Code (opcional)
#
# O script só instala o que estiver faltando. Pode rodar mais de uma vez sem problema.

param(
    # Inclui o Docker Desktop, necessário para usar o Dev Container.
    [switch]$ComDocker,

    # Inclui o VS Code. Opcional: o Dev Container também funciona pela
    # Dev Container CLI ou por outros editores (ver README).
    [switch]$ComVSCode
)

$ErrorActionPreference = "Stop"

function Write-Etapa([string]$texto) {
    Write-Host ""
    Write-Host "==> $texto" -ForegroundColor Cyan
}

function Test-Comando([string]$nome) {
    return $null -ne (Get-Command $nome -ErrorAction SilentlyContinue)
}

function Install-SeFaltar([string]$comando, [string]$wingetId, [string]$nomeAmigavel) {
    if (Test-Comando $comando) {
        Write-Host "OK: $nomeAmigavel já instalado." -ForegroundColor Green
        return
    }
    Write-Host "Instalando $nomeAmigavel..." -ForegroundColor Yellow
    winget install --id $wingetId --exact --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO ao instalar $nomeAmigavel (código $LASTEXITCODE). Veja a seção 'Solução de problemas' do README." -ForegroundColor Red
        exit 1
    }
}

# ---------------------------------------------------------------------------

Write-Etapa "Verificando o winget"
if (-not (Test-Comando "winget")) {
    Write-Host "O winget não foi encontrado. Instale o 'Instalador de Aplicativo' pela Microsoft Store e rode este script de novo." -ForegroundColor Red
    Write-Host "https://apps.microsoft.com/detail/9NBLGGH4NNS1"
    exit 1
}
Write-Host "OK: winget disponível." -ForegroundColor Green

Write-Etapa "Ferramentas básicas"
Install-SeFaltar "git"  "Git.Git"           "Git"
Install-SeFaltar "node" "OpenJS.NodeJS.LTS" "Node.js LTS"

if ($ComVSCode) {
    Write-Etapa "VS Code (opcional)"
    Install-SeFaltar "code" "Microsoft.VisualStudioCode" "Visual Studio Code"
}

if ($ComDocker) {
    Write-Etapa "Ferramentas do Dev Container"
    Install-SeFaltar "docker" "Docker.DockerDesktop" "Docker Desktop"

    Write-Etapa "Verificando o WSL (necessário para o Docker Desktop)"
    wsl.exe --status *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "O WSL ainda não está instalado. Ele exige administrador e uma reinicialização:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  1. Abra o PowerShell COMO ADMINISTRADOR"
        Write-Host "  2. Rode:  wsl --install --no-distribution"
        Write-Host "  3. Reinicie o computador"
        Write-Host "  4. Rode este script novamente para confirmar"
        Write-Host ""
    } else {
        Write-Host "OK: WSL instalado." -ForegroundColor Green
    }
}

Write-Etapa "Dependências do projeto (npm install)"
if (Test-Path (Join-Path $PSScriptRoot "package.json")) {
    Push-Location $PSScriptRoot
    try {
        # Se o Node acabou de ser instalado pelo winget, ele ainda não está no PATH
        # desta sessão — nesse caso, abra um terminal novo e rode "npm install".
        if (Test-Comando "npm") {
            npm install
        } else {
            Write-Host "O Node foi instalado agora e ainda não aparece neste terminal." -ForegroundColor Yellow
            Write-Host "Abra um TERMINAL NOVO nesta pasta e rode:  npm install"
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "package.json não encontrado — rode este script de dentro da pasta do projeto." -ForegroundColor Red
    exit 1
}

Write-Etapa "Pronto!"
Write-Host "Para rodar o jogo:  npx expo start --tunnel   (leia o QR Code com o Expo Go no celular)"
Write-Host "Ou no navegador:    npx expo start --web"
