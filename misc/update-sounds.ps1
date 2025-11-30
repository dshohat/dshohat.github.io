# Update sound files list in yaniv.html
# This script scans the sounds directory and updates the HTML file

Write-Host "Updating sound files list in yaniv.html..." -ForegroundColor Cyan
Write-Host ""

$htmlFile = "yaniv.html"
$soundsDir = "sounds"

# Check if sounds directory exists
if (-not (Test-Path $soundsDir)) {
    Write-Host "Error: sounds directory not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if HTML file exists
if (-not (Test-Path $htmlFile)) {
    Write-Host "Error: yaniv.html not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Get all sound files
$soundFiles = Get-ChildItem -Path $soundsDir -Include *.ogg,*.mp3,*.wav -File -Recurse

if ($soundFiles.Count -eq 0) {
    Write-Host "Warning: No sound files found in sounds directory!" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Display found files
Write-Host "Found sound files:" -ForegroundColor Green
Write-Host ""

$count = 0
$filesList = @()
foreach ($file in $soundFiles) {
    $count++
    Write-Host "  $count. $($file.Name)"
    $filesList += "                    'sounds/$($file.Name)'"
}

Write-Host ""
Write-Host "Total: $count sound files found" -ForegroundColor Green
Write-Host ""

# Create the new soundFiles array
$newArray = "                soundFiles = [`n"
$newArray += ($filesList -join ",`n")
$newArray += "`n                ];"

# Read the HTML content
Write-Host "Creating updated HTML file..." -ForegroundColor Cyan
$content = Get-Content $htmlFile -Raw

# Replace the soundFiles array in the HTML
$pattern = '(?s)(\s*soundFiles = \[).*?(\];)'
$newContent = $content -replace $pattern, $newArray

# Write back to file
Set-Content $htmlFile -Value $newContent -NoNewline

Write-Host ""
Write-Host "Success! yaniv.html has been updated with $count sound files." -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
