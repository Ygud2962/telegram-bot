param(
    [switch]$WithPostgres,
    [switch]$SkipSmoke,
    [int]$SmokePort = 8095
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')
$WorkspaceRoot = Resolve-Path -LiteralPath (Join-Path $ProjectRoot '..')
$BackendRoot = Resolve-Path -LiteralPath (Join-Path $ProjectRoot 'backend')
$FrontendApp = Join-Path $ProjectRoot 'frontend\app.js'
$BotFile = Join-Path $WorkspaceRoot 'bot.py'

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Command
    )

    Write-Host "==> $Name"
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
}

Push-Location $WorkspaceRoot
try {
    Invoke-Step "backend unit tests" {
        py -3 -m unittest discover zero-day-defenders-network\backend\tests -q
    }

    Invoke-Step "backend compile" {
        py -3 -m compileall -q zero-day-defenders-network\backend
    }

    Invoke-Step "bot compile" {
        py -3 -c "import os, py_compile, sys, tempfile; fd, cfile = tempfile.mkstemp(suffix='.pyc'); os.close(fd); py_compile.compile(sys.argv[1], cfile=cfile, doraise=True); os.remove(cfile)" $BotFile
    }

    Invoke-Step "frontend syntax" {
        node --check $FrontendApp
    }

    if (-not $SkipSmoke) {
        Write-Host "==> local MVP smoke"
        Push-Location $BackendRoot
        $oldDevAuth = $env:ZDNET_DEV_AUTH
        $oldPort = $env:ZDNET_PORT
        $env:ZDNET_DEV_AUTH = '1'
        $env:ZDNET_PORT = [string]$SmokePort
        $server = Start-Process -FilePath 'py' -ArgumentList @('-3', '-m', 'zdnet_backend.server') -WorkingDirectory $BackendRoot.Path -PassThru -WindowStyle Hidden
        try {
            Start-Sleep -Seconds 2
            py -3 tools\smoke_mvp.py --base-url "http://127.0.0.1:$SmokePort"
            if ($LASTEXITCODE -ne 0) {
                throw "local MVP smoke failed with exit code $LASTEXITCODE"
            }
        }
        finally {
            if ($server -and -not $server.HasExited) {
                Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
            }
            $env:ZDNET_DEV_AUTH = $oldDevAuth
            $env:ZDNET_PORT = $oldPort
            Pop-Location
        }
    }

    if ($WithPostgres) {
        $compose = Get-Command docker -ErrorAction SilentlyContinue
        if (-not $compose) {
            throw "Docker is required for -WithPostgres, but docker was not found."
        }

        Push-Location $ProjectRoot
        try {
            Invoke-Step "start PostgreSQL" {
                docker compose up -d postgres
            }

            Write-Host "==> wait for PostgreSQL"
            $ready = $false
            for ($i = 0; $i -lt 30; $i++) {
                docker compose exec -T postgres pg_isready -U zdnet -d zdnet | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    $ready = $true
                    break
                }
                Start-Sleep -Seconds 1
            }
            if (-not $ready) {
                throw "PostgreSQL container did not become ready."
            }
        }
        finally {
            Pop-Location
        }

        $oldDatabaseUrl = $env:ZDNET_DATABASE_URL
        $env:ZDNET_DATABASE_URL = 'postgresql://zdnet:zdnet_dev_password@127.0.0.1:55432/zdnet'
        try {
            Push-Location $BackendRoot
            Invoke-Step "PostgreSQL persistence gate" {
                py -3 tools\check_postgres_persistence.py
            }
        }
        finally {
            Pop-Location
            $env:ZDNET_DATABASE_URL = $oldDatabaseUrl
        }
    }

    Write-Host "All selected checks passed."
}
finally {
    Pop-Location
}
