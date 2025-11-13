#!/usr/bin/env pwsh
<#
.SYNOPSIS
    OpenText SAST (Fortify Static Code Analyzer) local scan script

.DESCRIPTION
    This script performs an OpenText SAST scan with the following steps:
    1. Clean the build
    2. Translate/analyze the source code
    3. Perform the scan
    The script supports reading additional options from a .fortify-options file.
    This file can contain [translation] and [scan] sections for respective options.

.PARAMETER BuildId
    The build ID for OpenText SAST (default: current directory name)

.PARAMETER ProjectRoot
    The project root directory for OpenText SAST (default: .fortify)

.PARAMETER VerboseOutput
    Enable verbose output for OpenText SAST

.PARAMETER DebugOutput
    Enable debug output for OpenText SAST

.EXAMPLE
    .\scan.ps1
    
.EXAMPLE
    .\scan.ps1 -BuildId "my-build" -VerboseOutput -DebugOutput
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$BuildId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectRoot = ".fortify",
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseOutput,
    
    [Parameter(Mandatory=$false)]
    [switch]$DebugOutput
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Set default BuildId to current directory name if not specified
if ([string]::IsNullOrEmpty($BuildId)) {
    $BuildId = Split-Path -Leaf (Get-Location)
    Write-Host "Using current directory name as BuildId: $BuildId" -ForegroundColor Cyan
}

# Function to execute sourceanalyzer command
function Invoke-SourceAnalyzer {
    param(
        [string]$Arguments
    )
    
    Write-Host "Executing: sourceanalyzer $Arguments" -ForegroundColor Cyan
    
    try {
        $process = Start-Process -FilePath "sourceanalyzer" `
                                  -ArgumentList $Arguments `
                                  -NoNewWindow `
                                  -Wait `
                                  -PassThru
        
        if ($process.ExitCode -ne 0) {
            Write-Error "sourceanalyzer failed with exit code: $($process.ExitCode)"
            exit $process.ExitCode
        }
    }
    catch {
        Write-Error "Failed to execute sourceanalyzer: $_"
        exit 1
    }
}

# Check if sourceanalyzer is available
Write-Host "Checking for sourceanalyzer..." -ForegroundColor Yellow
try {
    $null = Get-Command sourceanalyzer -ErrorAction Stop
    Write-Host "sourceanalyzer found." -ForegroundColor Green
}
catch {
    Write-Error "sourceanalyzer command not found. Please ensure OpenText SAST is installed and in your PATH."
    exit 1
}

# Build command arguments
$baseArgs = "`"-Dcom.fortify.sca.ProjectRoot=$ProjectRoot`" -b $BuildId"
$verboseArg = if ($VerboseOutput) { "-verbose" } else { "" }
$debugArg = if ($DebugOutput) { "-debug" } else { "" }

# Read options from .fortify-options if it exists
$optsFile = ".fortify-options"
$transOptions = ""
$scanOptions = ""

if (Test-Path $optsFile) {
    Write-Host "Reading options from $optsFile..." -ForegroundColor Yellow
    $currentSection = ""
    $transOptionsList = @()
    $scanOptionsList = @()
    
    Get-Content $optsFile | ForEach-Object {
        $line = $_.Trim()
        
        # Skip empty lines and comments
        if ($line -eq "" -or $line.StartsWith("#")) {
            return
        }
        
        # Check for section headers
        if ($line -match '^\[(.+)\]$') {
            $currentSection = $matches[1].ToLower()
            return
        }
        
        # Process option based on current section
        if ($currentSection -eq "translation") {
            # Quote -D options
            if ($line.StartsWith("-D")) {
                $transOptionsList += "`"$line`""
            } else {
                $transOptionsList += $line
            }
        }
        elseif ($currentSection -eq "scan") {
            # Quote -D options
            if ($line.StartsWith("-D")) {
                $scanOptionsList += "`"$line`""
            } else {
                $scanOptionsList += $line
            }
        }
    }
    
    $transOptions = $transOptionsList -join " "
    $scanOptions = $scanOptionsList -join " "
    
    if ($transOptions) {
        Write-Host "Translation options: $transOptions" -ForegroundColor Cyan
    }
    if ($scanOptions) {
        Write-Host "Scan options: $scanOptions" -ForegroundColor Cyan
    }
} else {
    Write-Host "No options file found ($optsFile)" -ForegroundColor Gray
}

Write-Host "`n=== Starting OpenText SAST Scan ===" -ForegroundColor Yellow
Write-Host "Build ID: $BuildId" -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean the build
Write-Host "[1/3] Cleaning build..." -ForegroundColor Yellow
Invoke-SourceAnalyzer "$baseArgs -clean"
Write-Host "Clean completed successfully.`n" -ForegroundColor Green

# Step 2: Translation phase
Write-Host "[2/3] Translating source code..." -ForegroundColor Yellow
$translateArgs = "$baseArgs $transOptions $verboseArg $debugArg ."
$translateArgs = $translateArgs -replace '\s+', ' '  # Remove extra spaces
Invoke-SourceAnalyzer $translateArgs.Trim()
Write-Host "Translation completed successfully.`n" -ForegroundColor Green

# Step 3: Scan phase
Write-Host "[3/3] Scanning..." -ForegroundColor Yellow
$fprFile = "$BuildId.fpr"
$scanArgs = "$baseArgs -scan $scanOptions -f `"$fprFile`" $verboseArg $debugArg"
$scanArgs = $scanArgs -replace '\s+', ' '  # Remove extra spaces
Invoke-SourceAnalyzer $scanArgs.Trim()
Write-Host "Scan completed successfully.`n" -ForegroundColor Green
Write-Host "FPR file created: $fprFile`n" -ForegroundColor Cyan

# Step 4: Summarize issues using FPRUtility
Write-Host "[4/4] Summarizing issues in FPR..." -ForegroundColor Yellow
try {
    $null = Get-Command FPRUtility -ErrorAction Stop
    Write-Host "Executing: FPRUtility -information -analyzerIssueCounts -project `"$fprFile`"" -ForegroundColor Cyan
    
    $process = Start-Process -FilePath "FPRUtility" `
                              -ArgumentList "-information -analyzerIssueCounts -project `"$fprFile`"" `
                              -NoNewWindow `
                              -Wait `
                              -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host "Issue summary completed successfully.`n" -ForegroundColor Green
    } else {
        Write-Warning "FPRUtility completed with exit code: $($process.ExitCode)"
    }
}
catch {
    Write-Warning "FPRUtility command not found. Skipping issue summary."
}

Write-Host "=== OpenText SAST Scan Complete ===" -ForegroundColor Green
Write-Host "Results available in: $fprFile" -ForegroundColor Cyan