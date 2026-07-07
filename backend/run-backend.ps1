# run-backend.ps1
$MavenVersion = "3.9.8"
$MavenDir = Join-Path $PSScriptRoot ".maven"
$ZipFile = Join-Path $PSScriptRoot "maven.zip"
$MavenHome = Join-Path $MavenDir "apache-maven-$MavenVersion"
$MvnPath = Join-Path $MavenHome "bin\mvn.cmd"

if (-not (Test-Path $MvnPath)) {
    Write-Host "Local Maven not found. Downloading Maven $MavenVersion..." -ForegroundColor Cyan
    if (-not (Test-Path $MavenDir)) {
        New-Item -ItemType Directory -Path $MavenDir | Out-Null
    }
    
    $Url = "https://archive.apache.org/dist/maven/maven-3/$MavenVersion/binaries/apache-maven-$MavenVersion-bin.zip"
    
    try {
        Invoke-WebRequest -Uri $Url -OutFile $ZipFile -UseBasicParsing
        Write-Host "Extracting Maven..." -ForegroundColor Cyan
        Expand-Archive -Path $ZipFile -DestinationPath $MavenDir -Force
        Remove-Item $ZipFile -Force
        Write-Host "Maven installed successfully at $MavenDir" -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to download/install Maven: $_"
        exit 1
    }
}

Write-Host "Starting Spring Boot Backend using Local Maven..." -ForegroundColor Green
& $MvnPath spring-boot:run
