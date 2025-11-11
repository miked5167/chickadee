# Automated Logo Scraping Script
# Processes all advisors in batches with auto-approval

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "AUTOMATED LOGO SCRAPING FOR ALL ADVISORS" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Change to the project directory
Set-Location "C:\Users\miked\Advisor Directory\hockey-directory"

# Total advisors: 201
# Already processed: 5 (batch 1)
# Remaining: 196
# Batch size: 12

$totalAdvisors = 201
$batchSize = 12
$startOffset = 5  # Start after the first 5

Write-Host "Starting automated scraping..." -ForegroundColor Yellow
Write-Host "Total advisors: $totalAdvisors" -ForegroundColor White
Write-Host "Batch size: $batchSize" -ForegroundColor White
Write-Host "Starting from advisor: $($startOffset + 1)" -ForegroundColor White
Write-Host ""

$batchNumber = 2
$currentOffset = $startOffset

while ($currentOffset -lt $totalAdvisors) {
    $endOffset = [Math]::Min($currentOffset + $batchSize, $totalAdvisors)
    $advisorsInBatch = $endOffset - $currentOffset

    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host "BATCH $batchNumber - Processing advisors $($currentOffset + 1) to $endOffset ($advisorsInBatch advisors)" -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host ""

    # Run the scraping script with auto-approve
    npm run scrape-logos -- --batch-size $batchSize --offset $currentOffset --auto-approve

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Batch $batchNumber failed!" -ForegroundColor Red
        Write-Host "Stopped at advisor $($currentOffset + 1)" -ForegroundColor Red
        Write-Host ""
        Write-Host "To resume, run:" -ForegroundColor Yellow
        Write-Host "  npm run scrape-logos -- --batch-size $batchSize --offset $currentOffset --auto-approve" -ForegroundColor Yellow
        exit 1
    }

    # Move to next batch
    $currentOffset = $endOffset
    $batchNumber++

    Write-Host ""
    Write-Host "Batch completed! Progress: $endOffset / $totalAdvisors advisors" -ForegroundColor Cyan
    Write-Host ""

    # Small delay between batches
    if ($currentOffset -lt $totalAdvisors) {
        Write-Host "Waiting 3 seconds before next batch..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
        Write-Host ""
    }
}

Write-Host "================================================================================" -ForegroundColor Green
Write-Host "ALL BATCHES COMPLETED!" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Total advisors processed: $totalAdvisors" -ForegroundColor White
Write-Host "Total batches: $($batchNumber - 1)" -ForegroundColor White
Write-Host ""
Write-Host "Check your Supabase database and Cloudinary account for the uploaded logos!" -ForegroundColor Cyan
