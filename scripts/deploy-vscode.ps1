param(
    [string]$CommitMessage = ""
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$text) {
    Write-Host ""
    Write-Host "==> $text" -ForegroundColor Cyan
}

function Invoke-GitPush([string]$repoPath) {
    Push-Location $repoPath
    try {
        git -c http.sslBackend=openssl push origin main
        if ($LASTEXITCODE -ne 0) {
            throw "git push failed"
        }
    }
    finally {
        Pop-Location
    }
}

function Sync-WorkingTree([string]$source, [string]$target) {
    robocopy $source $target /MIR /XD ".git" "node_modules" ".venv" "venv" "__pycache__" ".pytest_cache" ".mypy_cache" | Out-Null
    if ($LASTEXITCODE -ge 8) {
        throw "robocopy failed with code $LASTEXITCODE"
    }
}

$env:HTTP_PROXY = $null
$env:HTTPS_PROXY = $null
$env:ALL_PROXY = $null
$env:GIT_HTTP_PROXY = $null
$env:GIT_HTTPS_PROXY = $null

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = "auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}

Write-Step "Checking merge conflicts"
$conflicts = git diff --name-only --diff-filter=U
if ($LASTEXITCODE -ne 0) { throw "Unable to check conflicts" }
if ($conflicts) {
    throw "Resolve merge conflicts first: $($conflicts -join ', ')"
}

Write-Step "Ensuring branch main"
$branch = git rev-parse --abbrev-ref HEAD
if ($LASTEXITCODE -ne 0) { throw "Unable to detect branch" }
if ($branch.Trim() -ne "main") {
    git switch main
    if ($LASTEXITCODE -ne 0) { throw "Cannot switch to main" }
}

Write-Step "Trying normal deploy mode"
$normalModeOk = $true
try {
    $permTest = Join-Path $repoRoot ".git\__perm_test.tmp"
    "x" | Out-File -FilePath $permTest -Encoding ascii -ErrorAction Stop
    Remove-Item -LiteralPath $permTest -Force -ErrorAction SilentlyContinue

    git add -A
    if ($LASTEXITCODE -ne 0) { throw "git add failed" }

    git diff --cached --quiet
    if ($LASTEXITCODE -eq 1) {
        git commit -m $CommitMessage
        if ($LASTEXITCODE -ne 0) { throw "git commit failed" }
    }

    Invoke-GitPush -repoPath $repoRoot
}
catch {
    $normalModeOk = $false
    Write-Host "Normal mode failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

if ($normalModeOk) {
    Write-Host ""
    Write-Host "Deploy complete: pushed to GitHub/main. Railway will auto-deploy." -ForegroundColor Green
    exit 0
}

Write-Step "Switching to safe deploy mode (temp clone)"
$tmpRepo = Join-Path $env:TEMP ("telegram-bot-deploy-" + [guid]::NewGuid().ToString("N"))
try {
    $remote = git config --get remote.origin.url
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($remote)) {
        throw "Cannot read remote.origin.url"
    }

    git -c http.sslBackend=openssl clone --branch main --single-branch $remote $tmpRepo
    if ($LASTEXITCODE -ne 0) { throw "git clone failed" }

    Sync-WorkingTree -source $repoRoot -target $tmpRepo

    Push-Location $tmpRepo
    try {
        git add -A
        if ($LASTEXITCODE -ne 0) { throw "git add failed in safe mode" }

        git diff --cached --quiet
        if ($LASTEXITCODE -eq 1) {
            git commit -m $CommitMessage
            if ($LASTEXITCODE -ne 0) { throw "git commit failed in safe mode" }
        }

        Invoke-GitPush -repoPath $tmpRepo
    }
    finally {
        Pop-Location
    }

    Write-Host ""
    Write-Host "Deploy complete (safe mode): pushed to GitHub/main. Railway will auto-deploy." -ForegroundColor Green
}
finally {
    if (Test-Path $tmpRepo) {
        Remove-Item -LiteralPath $tmpRepo -Recurse -Force -ErrorAction SilentlyContinue
    }
}
