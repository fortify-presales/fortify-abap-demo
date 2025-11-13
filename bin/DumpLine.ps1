#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Runs Fortify translation and scan dump for a specific source line.

.DESCRIPTION
    Creates or switches to a working directory, optionally creates a sample C file,
    copies DumpLine.xml (from the script's directory) into that directory,
    replaces the line number placeholder, and runs Fortify translation + scan.

.PARAMETER LineNumber
    The line number to inject into the DumpLine.xml rule file (default = 1).

.PARAMETER CompileCommand
    The compiler or build command used by sourceanalyzer for translation.
    Example: "gcc" or "clang". If omitted, files are translated without compilation.

.PARAMETER FilesToScan
    The source files or patterns to translate. Example: "*.abap" or "file1.abap file2.clas.abap".
    If omitted, auto-detects source files in the working directory.

.PARAMETER WorkDir
    The working directory to isolate all files (default = "test_isolated").

.PARAMETER Sample
    When present, creates a sample C file (test.c) for proof-of-concept.

.EXAMPLE
    ./DumpLine.ps1 -LineNumber 7 -CompileCommand "gcc" -FilesToScan "*.c" -WorkDir "demo_run" -Sample
#>

param(
    [Parameter(Mandatory = $false)]
    [int]$LineNumber = 1,

    [Parameter(Mandatory = $false)]
    [string]$CompileCommand = "",

    [Parameter(Mandatory = $false)]
    [string]$FilesToScan = "",

    [Parameter(Mandatory = $false)]
    [string]$WorkDir = "test_isolated",

    [Parameter(Mandatory = $false)]
    [switch]$Sample
)

Write-Host "==> Using line number: $LineNumber" -ForegroundColor Cyan
Write-Host "==> Using working directory: $WorkDir" -ForegroundColor Cyan
if ($CompileCommand) {
    Write-Host "==> Compile command: $CompileCommand" -ForegroundColor Cyan
} else {
    Write-Host "==> No compile command provided - using direct translation." -ForegroundColor DarkGray
}
if ($Sample) { Write-Host "==> Sample mode enabled: will create test.c" -ForegroundColor Yellow }

# Step 1: Resolve the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "==> Script directory: $ScriptDir" -ForegroundColor DarkGray

# Step 2: Ensure working directory exists (absolute path)
if (-not (Test-Path $WorkDir)) {
    Write-Host "==> Creating working directory $WorkDir ..."
    New-Item -ItemType Directory -Path $WorkDir | Out-Null
}
$WorkDir = (Resolve-Path $WorkDir).Path

# Step 3: Clean up existing DumpLine*.xml files from working directory
Write-Host "==> Cleaning up existing DumpLine*.xml files from $WorkDir ..."
$existingRules = Get-ChildItem -Path $WorkDir -Name "DumpLine*.xml" -ErrorAction SilentlyContinue
if ($existingRules) {
    foreach ($file in $existingRules) {
        $fullPath = Join-Path $WorkDir $file
        Write-Host "    Removing: $fullPath" -ForegroundColor DarkYellow
        Remove-Item -Path $fullPath -Force
    }
    Write-Host "==> Removed $($existingRules.Count) existing DumpLine*.xml file(s)" -ForegroundColor Green
} else {
    Write-Host "==> No existing DumpLine*.xml files found" -ForegroundColor DarkGray
}

# Step 4: Locate DumpLine.xml beside this script
$srcRule = Join-Path $ScriptDir "DumpLine.xml"
if (-not (Test-Path $srcRule)) {
    Write-Error "ERROR: Cannot find DumpLine.xml next to this script ($srcRule)."
    exit 1
}

# Step 5: Copy DumpLine.xml into working directory
$dstRule = Join-Path $WorkDir ("DumpLine_{0}.xml" -f $LineNumber)
Write-Host "==> Copying $srcRule to $dstRule ..."
Copy-Item -Path $srcRule -Destination $dstRule -Force

# Step 6: Change into the working directory
Push-Location $WorkDir
Write-Host "==> Changed working directory to $(Get-Location)" -ForegroundColor DarkCyan

# Step 7 (optional): Create a sample C file
if ($Sample) {
    Write-Host "==> Creating sample C file: test.c ..."
    'int main(){ printf("stuff"); return 0; }' | Out-File -Encoding ascii -FilePath ./test.c -Force
} else {
    Write-Host "==> Skipping sample creation (Sample flag not provided)." -ForegroundColor DarkGray
}

# Step 8: Clear previous Fortify build data
Write-Host "==> Cleaning previous Fortify build data ..."
sourceanalyzer -b dump-line -clean

# Step 9: Run Fortify translation (always performed)
Write-Host "==> Running Fortify translation ..."

# Determine files to scan
if (-not $FilesToScan) {
    # Auto-detect file types in current directory
    $potentialFiles = Get-ChildItem -Path . -File | Where-Object { 
        $_.Extension -match '\.(abap|c|cpp|java|js|py)$' -or $_.Name -match '\.(prog|clas|ddls|bdef)\..*$'
    }
    if ($potentialFiles) {
        $FilesToScan = ($potentialFiles | ForEach-Object { $_.Name }) -join ' '
        Write-Host "==> Auto-detected files: $FilesToScan" -ForegroundColor Yellow
    } else {
        Write-Warning "No source files found in current directory. Using *.* pattern."
        $FilesToScan = "*.*"
    }
}

# Split file list and process each file individually
$fileList = $FilesToScan -split '\s+' | Where-Object { $_ -ne '' }
Write-Host "==> Processing $($fileList.Count) file(s) individually..." -ForegroundColor Cyan

foreach ($file in $fileList) {
    Write-Host "    Translating: $file" -ForegroundColor DarkCyan
    if ($CompileCommand) {
        sourceanalyzer -b dump-line "-Dcom.fortify.sca.ProjectRoot=.fortify" `
            "-Dcom.fortify.sca.AbapDebug=true" $CompileCommand $file -c
    } else {
        # For languages that don't need compilation (like ABAP)
        sourceanalyzer -b dump-line "-Dcom.fortify.sca.ProjectRoot=.fortify" `
            "-Dcom.fortify.sca.AbapDebug=true" $file
    }
}

# Step 10: Replace LINE_NUMBER in the copied DumpLine.xml
$localRule = Join-Path (Get-Location) ("DumpLine_{0}.xml" -f $LineNumber)
Write-Host "==> Updating LINE_NUMBER in $localRule ..."

# Read the content and replace LINE_NUMBER
$content = (Get-Content $localRule -Raw) -replace 'LINE_NUMBER', $LineNumber

# Write back without BOM using .NET method
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($localRule, $content, $utf8NoBom)

# Step 11: Run Fortify scan dump
Write-Host "==> Running Fortify scan and dumping structural tree ..."
sourceanalyzer -b dump-line -scan -no-default-rules -rules $localRule `
    "-Dcom.fortify.sca.ProjectRoot=.fortify" `
    "-Dcom.fortify.sca.AbapDebug=true" `
    "-Ddebug.dump-structural-tree" -logfile trans.log `
    2> ./tree.tree | Out-Null

Write-Host "Done. Output written to $WorkDir/tree.tree" -ForegroundColor Green

# Step 12: Return to original directory
Pop-Location
Write-Host "==> Returned to original directory." -ForegroundColor DarkCyan