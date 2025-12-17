# Notion Sync Helper
# This now runs the automated headless browser script to pull your notes.
# Requirement: Node.js and Puppeteer installed.

Write-Host "Starting Notion Sync..." -ForegroundColor Cyan

# Check for node modules (simple check)
if (-not (Test-Path "$PSScriptRoot\scripts\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Push-Location "$PSScriptRoot\scripts"
    npm install
    Pop-Location
}

# Run the sync script
node "$PSScriptRoot\scripts\sync-notion.js"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Sync Complete! Check your site." -ForegroundColor Green
} else {
    Write-Host "Sync failed. Check output above." -ForegroundColor Red
}

Start-Sleep -Seconds 3
