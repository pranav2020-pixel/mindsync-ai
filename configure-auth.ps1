# MindSync AI - Interactive Authentication & Gmail Credentials Setup
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      MindSync AI - Google OAuth & Gmail Setup Wizard      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will safely save your credentials to your local .env files." -ForegroundColor Gray
Write-Host "Press [Enter] to skip any field you don't have yet." -ForegroundColor Gray
Write-Host ""

$rootEnv = "$PSScriptRoot\.env"
$backendEnv = "$PSScriptRoot\backend\.env"
$frontendEnv = "$PSScriptRoot\frontend\.env.local"

# 1. Google OAuth Client ID
Write-Host "[1/4] Google Cloud OAuth Client ID" -ForegroundColor Yellow
Write-Host "Get it from: https://console.cloud.google.com/apis/credentials" -ForegroundColor DarkGray
$googleClientId = Read-Host "Enter GOOGLE_CLIENT_ID"

# 2. Google OAuth Client Secret
Write-Host ""
Write-Host "[2/4] Google Cloud OAuth Client Secret" -ForegroundColor Yellow
$googleClientSecret = Read-Host "Enter GOOGLE_CLIENT_SECRET"

# 3. Gmail Address
Write-Host ""
Write-Host "[3/4] Gmail Address for sending OTP" -ForegroundColor Yellow
$gmailUser = Read-Host "Enter your Gmail address (e.g., yourname@gmail.com)"

# 4. Gmail App Password
Write-Host ""
Write-Host "[4/4] 16-Character Gmail App Password" -ForegroundColor Yellow
Write-Host "Create one at: https://myaccount.google.com/apppasswords" -ForegroundColor DarkGray
$gmailPass = Read-Host -AsSecureString "Enter your Gmail App Password (typing hidden)"
$gmailPassPlain = ""
if ($gmailPass) {
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($gmailPass)
    $gmailPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

function Update-EnvFile($filePath, $updates) {
    if (-not (Test-Path $filePath)) {
        New-Item -ItemType File -Path $filePath -Force | Out-Null
    }
    $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
    if (-not $content) { $content = "" }

    foreach ($key in $updates.Keys) {
        $val = $updates[$key]
        if ([string]::IsNullOrWhiteSpace($val)) { continue }

        $pattern = "(?m)^$key=.*`$"
        if ($content -match $pattern) {
            $content = $content -replace $pattern, "$key=$val"
        } else {
            if ($content.Length -gt 0 -and -not $content.EndsWith("`n")) {
                $content += "`n"
            }
            $content += "$key=$val`n"
        }
    }
    Set-Content -Path $filePath -Value $content -NoNewline
}

# Updates for Backend
$backendUpdates = @{}
if ($googleClientId) { $backendUpdates["GOOGLE_CLIENT_ID"] = $googleClientId }
if ($googleClientSecret) { $backendUpdates["GOOGLE_CLIENT_SECRET"] = $googleClientSecret }
if ($gmailUser) { 
    $backendUpdates["SMTP_SERVICE"] = "gmail"
    $backendUpdates["SMTP_HOST"] = "smtp.gmail.com"
    $backendUpdates["SMTP_PORT"] = "587"
    $backendUpdates["SMTP_USER"] = $gmailUser 
    $backendUpdates["SMTP_FROM"] = "`"MindSync AI`" <$gmailUser>"
}
if ($gmailPassPlain) { 
    # Remove any spaces in app password
    $cleanPass = $gmailPassPlain.Replace(" ", "")
    $backendUpdates["SMTP_PASS"] = $cleanPass 
}

# Updates for Frontend
$frontendUpdates = @{}
if ($googleClientId) { 
    $frontendUpdates["NEXT_PUBLIC_GOOGLE_CLIENT_ID"] = $googleClientId 
}
$frontendUpdates["NEXT_PUBLIC_API_URL"] = "http://localhost:4000/api/v1"

# Save
Update-EnvFile $backendEnv $backendUpdates
Update-EnvFile $rootEnv $backendUpdates
Update-EnvFile $frontendEnv $frontendUpdates

Write-Host ""
Write-Host "Configuration saved successfully!" -ForegroundColor Green
Write-Host "- Backend:  $backendEnv" -ForegroundColor Gray
Write-Host "- Frontend: $frontendEnv" -ForegroundColor Gray
Write-Host ""
Write-Host "You can now run: npm run dev" -ForegroundColor Cyan
Write-Host ""
