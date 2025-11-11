# Automated Logo Scraping Script - FROM BEGINNING
# Processes ALL 201 advisors in batches with auto-approval

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "AUTOMATED LOGO SCRAPING FOR ALL ADVISORS (FROM START)" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Change to the project directory
Set-Location "C:\Users\miked\Advisor Directory\hockey-directory"

# Configuration
$totalAdvisors = 201
$firstBatchSize = 5    # Test with 5 first
$batchSize = 12        # Then 12 for the rest
$startOffset = 0       # Start from the very beginning

Write-Host "Starting automated scraping..." -ForegroundColor Yellow
Write-Host "Total advisors: $totalAdvisors" -ForegroundColor White
Write-Host "First batch: $firstBatchSize advisors" -ForegroundColor White
Write-Host "Subsequent batches: $batchSize advisors" -ForegroundColor White
Write-Host ""

$batchNumber = 1
$currentOffset = $startOffset

# First batch (5 advisors)
Write-Host "================================================================================" -ForegroundColor Green
Write-Host "BATCH $batchNumber - Processing advisors 1 to $firstBatchSize ($firstBatchSize advisors)" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
Write-Host ""

npm run scrape-logos -- --batch-size $firstBatchSize --offset $currentOffset --auto-approve

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Batch $batchNumber failed!" -ForegroundColor Red
    exit 1
}

$currentOffset = $firstBatchSize
$batchNumber++

Write-Host ""
Write-Host "Batch completed! Progress: $currentOffset / $totalAdvisors advisors" -ForegroundColor Cyan
Write-Host ""
Write-Host "Waiting 3 seconds before next batch..." -ForegroundColor Gray
Start-Sleep -Seconds 3
Write-Host ""

# Remaining batches (12 advisors each)
while ($currentOffset -lt $totalAdvisors) {
    $endOffset = [Math]::Min($currentOffset + $batchSize, $totalAdvisors)
    $advisorsInBatch = $endOffset - $currentOffset

    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host "BATCH $batchNumber - Processing advisors $($currentOffset + 1) to $endOffset ($advisorsInBatch advisors)" -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host ""

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

    $currentOffset = $endOffset
    $batchNumber++

    Write-Host ""
    Write-Host "Batch completed! Progress: $endOffset / $totalAdvisors advisors" -ForegroundColor Cyan
    Write-Host ""

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
Write-Host ""
Write-Host "Summary will be in the terminal output above." -ForegroundColor White
