<#
Switches the backend from SQLite to the local PostgreSQL 18 server.

Creates the 'screening' role and database, points backend/.env at PostgreSQL,
creates the tables, and seeds the demo data.

Usage (from backend/):
    .\setup_postgres.ps1                       # prompts for the postgres superuser password
    .\setup_postgres.ps1 -SuperUserPassword 'secret'
    .\setup_postgres.ps1 -NoSeed               # skip seeding

Afterwards, restart uvicorn so it picks up the new DATABASE_URL.
#>
param(
    [string]$SuperUser = 'postgres',
    [string]$SuperUserPassword,
    [string]$DbHost = 'localhost',
    [int]$Port = 5432,
    [string]$AppUser = 'screening',
    [string]$AppPassword = 'screening',
    [string]$Database = 'screening',
    [switch]$NoSeed
)

$ErrorActionPreference = 'Stop'

# --- Locate psql (not on PATH by default on Windows) --------------------
$psql = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\psql.exe' -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1
if (-not $psql) { throw "psql.exe not found under C:\Program Files\PostgreSQL\*\bin\" }
Write-Host "Using $($psql.FullName)" -ForegroundColor DarkGray

if (-not $SuperUserPassword) {
    $secure = Read-Host "Password for PostgreSQL superuser '$SuperUser'" -AsSecureString
    $SuperUserPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

function Invoke-Psql {
    param([string]$Db = 'postgres', [Parameter(Mandatory)][string]$Sql)
    $env:PGPASSWORD = $SuperUserPassword
    try {
        $out = & $psql.FullName -U $SuperUser -h $DbHost -p $Port -d $Db -v ON_ERROR_STOP=1 -tAc $Sql 2>&1
        if ($LASTEXITCODE -ne 0) { throw "psql failed: $out" }
        return $out
    } finally { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
}

# --- Create role and database (idempotent) ------------------------------
Write-Host "`n>> Creating role '$AppUser'" -ForegroundColor Cyan
$roleExists = Invoke-Psql -Sql "SELECT 1 FROM pg_roles WHERE rolname = '$AppUser';"
if ($roleExists -match '1') {
    Invoke-Psql -Sql "ALTER ROLE $AppUser WITH LOGIN PASSWORD '$AppPassword';" | Out-Null
    Write-Host "   role already existed - password reset"
} else {
    Invoke-Psql -Sql "CREATE ROLE $AppUser WITH LOGIN PASSWORD '$AppPassword';" | Out-Null
    Write-Host "   created"
}

Write-Host ">> Creating database '$Database'" -ForegroundColor Cyan
$dbExists = Invoke-Psql -Sql "SELECT 1 FROM pg_database WHERE datname = '$Database';"
if ($dbExists -match '1') {
    Write-Host "   database already existed - leaving it alone"
} else {
    Invoke-Psql -Sql "CREATE DATABASE $Database OWNER $AppUser;" | Out-Null
    Write-Host "   created"
}

# PostgreSQL 15+ locks down the public schema; the app role needs it explicitly.
Invoke-Psql -Db $Database -Sql "GRANT ALL ON SCHEMA public TO $AppUser;" | Out-Null
Invoke-Psql -Db $Database -Sql "ALTER DATABASE $Database OWNER TO $AppUser;" | Out-Null

# --- Point .env at PostgreSQL -------------------------------------------
$url = "postgresql+psycopg2://${AppUser}:${AppPassword}@${DbHost}:${Port}/${Database}"
Write-Host "`n>> Updating .env" -ForegroundColor Cyan

if (-not (Test-Path .\.env)) { Copy-Item .\.env.example .\.env }
$lines = Get-Content .\.env
if ($lines -match '^\s*DATABASE_URL=') {
    # Comment out the old value rather than losing it.
    $lines = $lines | ForEach-Object {
        if ($_ -match '^\s*DATABASE_URL=' ) { "# (was) $_`nDATABASE_URL=$url" } else { $_ }
    }
} else {
    $lines += "DATABASE_URL=$url"
}
$lines -join "`n" | Set-Content .\.env -Encoding utf8
Write-Host "   DATABASE_URL=$url"

# --- Create tables and seed ---------------------------------------------
Write-Host "`n>> Creating tables" -ForegroundColor Cyan
.\.venv\Scripts\python.exe -c "from app.database import Base, engine; import app.models; Base.metadata.create_all(bind=engine); print('   tables:', ', '.join(sorted(Base.metadata.tables)))"

if (-not $NoSeed) {
    Write-Host "`n>> Seeding demo data" -ForegroundColor Cyan
    .\.venv\Scripts\python.exe seed.py
}

Write-Host "`nDone. Restart uvicorn to pick up the new DATABASE_URL:" -ForegroundColor Green
Write-Host "  .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"
