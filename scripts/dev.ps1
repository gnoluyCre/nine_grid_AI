param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

function Start-DevWindow {
    param(
        [Parameter(Mandatory = $true)]
        [string]$WorkingDirectory,
        [Parameter(Mandatory = $true)]
        [string]$CommandText
    )

    Start-Process -FilePath "powershell.exe" `
        -WorkingDirectory $WorkingDirectory `
        -ArgumentList @("-NoExit", "-Command", $CommandText) `
        -WindowStyle Normal
}

if ($BackendOnly -and $FrontendOnly) {
    throw "Do not pass BackendOnly and FrontendOnly together."
}

$startBackend = -not $FrontendOnly
$startFrontend = -not $BackendOnly

if ($startBackend) {
    Start-DevWindow `
        -WorkingDirectory $projectRoot `
        -CommandText "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"
}

if ($startFrontend) {
    $frontendDirectory = Join-Path $projectRoot "frontend"
    Start-DevWindow `
        -WorkingDirectory $frontendDirectory `
        -CommandText "npm run dev -- --host 127.0.0.1 --port 5173"
}
