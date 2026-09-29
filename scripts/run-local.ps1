param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$repo = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $repo "apps\backend"
$frontend = Join-Path $repo "apps\frontend"

if (-not $FrontendOnly) {
    $backendEnv = Join-Path $backend "local.env"
    if (-not (Test-Path $backendEnv)) {
        Write-Error "Missing apps/backend/local.env. Copy local.env.example and configure PostgreSQL/Redis first."
        exit 1
    }

    Get-Content $backendEnv | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($name -match '^[A-Za-z_][A-Za-z0-9_]*$') {
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
    }

    $venvPython = Join-Path $backend ".venv\Scripts\python.exe"
    if (-not (Test-Path $venvPython)) {
        Write-Error "Missing backend virtual environment. Run: py -3.12 -m venv apps/backend/.venv"
        exit 1
    }

    if (-not (Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet)) {
        Write-Error "PostgreSQL is not reachable on localhost:5432. Install/start PostgreSQL or use a hosted DATABASE_URL in apps/backend/local.env."
        exit 1
    }

    $redisUrl = [Environment]::GetEnvironmentVariable("REDIS_URL", "Process")
    if ($redisUrl -notlike "memory://*" -and -not (Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet)) {
        Write-Error "Redis is not reachable on localhost:6379. Use REDIS_URL=memory://local for lightweight development or configure a hosted Redis URL."
        exit 1
    }

    Push-Location $backend
    & $venvPython -m alembic upgrade head
    $migrationExitCode = $LASTEXITCODE
    Pop-Location
    if ($migrationExitCode -ne 0) {
        Write-Error "Alembic migrations failed. Check DATABASE_URL in apps/backend/local.env."
        exit 1
    }

    Push-Location $backend
    & $venvPython -m scripts.seed_local
    $seedExitCode = $LASTEXITCODE
    Pop-Location
    if ($seedExitCode -ne 0) {
        Write-Error "Local clothing seed failed."
        exit 1
    }

    Start-Process -FilePath $venvPython -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000" -WorkingDirectory $backend
    Write-Host "FastAPI started on http://localhost:8000"
}

if (-not $BackendOnly) {
    Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $frontend
    Write-Host "Next.js started on http://localhost:3001"
}

Write-Host "Docker is not used. Stop the opened terminals when finished."
