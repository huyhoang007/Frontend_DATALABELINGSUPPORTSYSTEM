# ============================================
# FE-BE Connection Test Script
# ============================================
# Mục đích: Test kết nối Frontend ↔ Backend
# Chỉ test phía Frontend, KHÔNG sửa Backend
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🔍 FE-BE CONNECTION TEST SCRIPT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ErrorActionPreference = "Continue"
$testResults = @()

# ============================================
# 1. CHECK BACKEND STATUS
# ============================================
Write-Host "1️⃣ Checking Backend Status..." -ForegroundColor Yellow

try {
    $backendHealth = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Backend is RUNNING on port 8080" -ForegroundColor Green
    Write-Host "   Response: $($backendHealth.Content)" -ForegroundColor Gray
    $testResults += @{ Test = "Backend Status"; Status = "PASS"; Message = "Backend running" }
}
catch {
    Write-Host "   ❌ Backend is OFFLINE" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n   ⚠️  Please start backend first:" -ForegroundColor Yellow
    Write-Host "   cd 'c:\Users\hai yen\Desktop\BE1\Backend_DATALABELINGSUPPORTSYSTEM'" -ForegroundColor Gray
    Write-Host "   .\mvnw spring-boot:run`n" -ForegroundColor Gray
    $testResults += @{ Test = "Backend Status"; Status = "FAIL"; Message = "Backend offline" }
    
    Write-Host "`n❌ Cannot proceed without backend. Exiting...`n" -ForegroundColor Red
    exit 1
}

# ============================================
# 2. TEST LOGIN ENDPOINT (Direct to Backend)
# ============================================
Write-Host "`n2️⃣ Testing Login Endpoint (Direct to Backend)..." -ForegroundColor Yellow

$loginPayload = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginPayload `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    Write-Host "   ✅ Login endpoint works!" -ForegroundColor Green
    Write-Host "   Status: $($loginResponse.StatusCode)" -ForegroundColor Gray
    Write-Host "   Token: $($loginData.accessToken.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "   Username: $($loginData.username)" -ForegroundColor Gray
    Write-Host "   Role: $($loginData.role)" -ForegroundColor Gray
    
    $testResults += @{ Test = "Login API (Direct)"; Status = "PASS"; Message = "Login successful" }
    $global:testToken = $loginData.accessToken
}
catch {
    Write-Host "   ❌ Login failed" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Login API (Direct)"; Status = "FAIL"; Message = $_.Exception.Message }
}

# ============================================
# 3. TEST PROTECTED ENDPOINT
# ============================================
Write-Host "`n3️⃣ Testing Protected Endpoint (/api/users/me)..." -ForegroundColor Yellow

if ($global:testToken) {
    try {
        $headers = @{
            "Authorization" = "Bearer $($global:testToken)"
            "Content-Type"  = "application/json"
        }
        
        $meResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/users/me" `
            -Method GET `
            -Headers $headers `
            -TimeoutSec 10 `
            -ErrorAction Stop
        
        $meData = $meResponse.Content | ConvertFrom-Json
        
        Write-Host "   ✅ Protected endpoint works!" -ForegroundColor Green
        Write-Host "   User ID: $($meData.id)" -ForegroundColor Gray
        Write-Host "   Username: $($meData.username)" -ForegroundColor Gray
        Write-Host "   Email: $($meData.email)" -ForegroundColor Gray
        Write-Host "   Role: $($meData.role)" -ForegroundColor Gray
        
        $testResults += @{ Test = "Protected Endpoint"; Status = "PASS"; Message = "Auth token works" }
    }
    catch {
        Write-Host "   ❌ Protected endpoint failed" -ForegroundColor Red
        Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Protected Endpoint"; Status = "FAIL"; Message = $_.Exception.Message }
    }
}
else {
    Write-Host "   ⏭️  Skipped (no token from login)" -ForegroundColor Yellow
    $testResults += @{ Test = "Protected Endpoint"; Status = "SKIP"; Message = "No token" }
}

# ============================================
# 4. CHECK FRONTEND CONFIGURATION
# ============================================
Write-Host "`n4️⃣ Checking Frontend Configuration..." -ForegroundColor Yellow

# Check vite.config.js
$viteConfig = Get-Content "vite.config.js" -Raw
if ($viteConfig -match "target:\s*'http://127\.0\.0\.1:8080'") {
    Write-Host "   ✅ Vite proxy target: http://127.0.0.1:8080" -ForegroundColor Green
    $testResults += @{ Test = "Vite Proxy Config"; Status = "PASS"; Message = "Correct target" }
}
else {
    Write-Host "   ❌ Vite proxy target incorrect!" -ForegroundColor Red
    $testResults += @{ Test = "Vite Proxy Config"; Status = "FAIL"; Message = "Wrong target" }
}

# Check .env
$envFile = Get-Content ".env" -Raw
if ($envFile -match "VITE_API_BASE_URL=/") {
    Write-Host "   ✅ .env: VITE_API_BASE_URL=/" -ForegroundColor Green
    $testResults += @{ Test = ".env Config"; Status = "PASS"; Message = "Correct baseURL" }
}
else {
    Write-Host "   ⚠️  .env: VITE_API_BASE_URL not set to /" -ForegroundColor Yellow
    $testResults += @{ Test = ".env Config"; Status = "WARN"; Message = "Check baseURL" }
}

# Check apiClient.js
$apiClient = Get-Content "src\api\apiClient.js" -Raw
if ($apiClient -match 'baseURL:\s*import\.meta\.env\.VITE_API_BASE_URL') {
    Write-Host "   ✅ apiClient.js: baseURL uses env variable" -ForegroundColor Green
    $testResults += @{ Test = "apiClient Config"; Status = "PASS"; Message = "Correct setup" }
}
else {
    Write-Host "   ❌ apiClient.js: baseURL not using env variable!" -ForegroundColor Red
    $testResults += @{ Test = "apiClient Config"; Status = "FAIL"; Message = "Wrong setup" }
}

# ============================================
# 5. FRONTEND DEV SERVER CHECK
# ============================================
Write-Host "`n5️⃣ Checking Frontend Dev Server..." -ForegroundColor Yellow

try {
    $feResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Frontend is RUNNING on port 3000" -ForegroundColor Green
    $testResults += @{ Test = "Frontend Server"; Status = "PASS"; Message = "FE running" }
}
catch {
    Write-Host "   ⚠️  Frontend is NOT running" -ForegroundColor Yellow
    Write-Host "   Please start: npm run dev" -ForegroundColor Gray
    $testResults += @{ Test = "Frontend Server"; Status = "WARN"; Message = "FE not running" }
}

# ============================================
# 6. SUMMARY
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$warnCount = ($testResults | Where-Object { $_.Status -eq "WARN" }).Count
$skipCount = ($testResults | Where-Object { $_.Status -eq "SKIP" }).Count

foreach ($result in $testResults) {
    $icon = switch ($result.Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "WARN" { "⚠️ " }
        "SKIP" { "⏭️ " }
    }
    $color = switch ($result.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
        "SKIP" { "Gray" }
    }
    Write-Host "$icon $($result.Test): $($result.Message)" -ForegroundColor $color
}

Write-Host "`n----------------------------------------" -ForegroundColor Cyan
Write-Host "Total: $($testResults.Count) tests" -ForegroundColor White
Write-Host "✅ Passed: $passCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host "⚠️  Warnings: $warnCount" -ForegroundColor Yellow
Write-Host "⏭️  Skipped: $skipCount" -ForegroundColor Gray
Write-Host "----------------------------------------`n" -ForegroundColor Cyan

# ============================================
# 7. RECOMMENDATIONS
# ============================================
Write-Host "🎯 RECOMMENDATIONS:`n" -ForegroundColor Cyan

if ($failCount -eq 0 -and $warnCount -eq 0) {
    Write-Host "✅ All tests passed! FE-BE connection is working correctly." -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Test login from browser: http://localhost:3000/login" -ForegroundColor Gray
    Write-Host "2. Check browser console for [API] logs" -ForegroundColor Gray
    Write-Host "3. Verify token is saved in localStorage" -ForegroundColor Gray
}
else {
    Write-Host "⚠️  Some tests failed or have warnings." -ForegroundColor Yellow
    Write-Host "`nFrontend fixes needed:" -ForegroundColor Yellow
    
    if (($testResults | Where-Object { $_.Test -eq "Vite Proxy Config" -and $_.Status -eq "FAIL" })) {
        Write-Host "- Fix vite.config.js proxy target to: http://127.0.0.1:8080" -ForegroundColor Red
    }
    
    if (($testResults | Where-Object { $_.Test -eq ".env Config" -and $_.Status -ne "PASS" })) {
        Write-Host "- Set VITE_API_BASE_URL=/ in .env file" -ForegroundColor Red
    }
    
    if (($testResults | Where-Object { $_.Test -eq "apiClient Config" -and $_.Status -eq "FAIL" })) {
        Write-Host "- Fix apiClient.js baseURL configuration" -ForegroundColor Red
    }
    
    if (($testResults | Where-Object { $_.Test -eq "Frontend Server" -and $_.Status -eq "WARN" })) {
        Write-Host "- Start frontend: npm run dev" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
