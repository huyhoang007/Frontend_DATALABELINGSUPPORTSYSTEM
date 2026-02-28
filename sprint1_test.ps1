# Sprint 1 API Test Script
# Tests all 8 Sprint 1 functions

$baseUrl = "http://localhost:8080"
$results = @()

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [string]$Token = $null,
        [int]$ExpectedStatus = 200
    )
    
    $headers = @{"Content-Type" = "application/json" }
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        $params = @{
            Method  = $Method
            Uri     = $Url
            Headers = $headers
        }
        if ($Body) {
            $params["Body"] = $Body
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        $status = $response.StatusCode
        $content = $response.Content
        $pass = $status -eq $ExpectedStatus -or $status -eq 200 -or $status -eq 201
        
        return @{
            Name     = $Name
            Status   = $status
            Pass     = $pass
            Response = $content.Substring(0, [Math]::Min(200, $content.Length))
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        return @{
            Name     = $Name
            Status   = $statusCode
            Pass     = $false
            Response = $_.Exception.Message
        }
    }
}

Write-Host "====== SPRINT 1 API TESTS ======" -ForegroundColor Cyan
Write-Host ""

# A1) REGISTER
Write-Host "A1) Testing REGISTER..." -ForegroundColor Yellow
$registerBody = @{username = "testuser$(Get-Random)"; email = "test$(Get-Random)@test.com"; password = "Pass123!"; fullName = "Test User"; roleId = 2 } | ConvertTo-Json
$r = Test-Endpoint -Name "Register" -Method "POST" -Url "$baseUrl/api/auth/register" -Body $registerBody
Write-Host "  Status: $($r.Status) | Pass: $($r.Pass)" -ForegroundColor $(if ($r.Pass) { "Green" }else { "Red" })
$results += $r

# A2) LOGIN (MANAGER)
Write-Host "A2) Testing LOGIN (MANAGER)..." -ForegroundColor Yellow
$loginBody = @{username = "testmanager"; password = "Test123!" } | ConvertTo-Json
try {
    $loginResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $managerToken = $loginResp.accessToken
    Write-Host "  Status: 200 | Pass: True | Role: $($loginResp.role)" -ForegroundColor Green
    $results += @{Name = "Login MANAGER"; Status = 200; Pass = $true; Response = "Token received, Role: $($loginResp.role)" }
}
catch {
    Write-Host "  Status: FAIL | Error: $($_.Exception.Message)" -ForegroundColor Red
    $results += @{Name = "Login MANAGER"; Status = 0; Pass = $false; Response = $_.Exception.Message }
    $managerToken = $null
}

# LOGIN (ADMIN)
Write-Host "A2b) Testing LOGIN (ADMIN)..." -ForegroundColor Yellow
$loginBody = @{username = "testadmin"; password = "Admin123!" } | ConvertTo-Json
try {
    $loginResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $adminToken = $loginResp.accessToken
    Write-Host "  Status: 200 | Pass: True | Role: $($loginResp.role)" -ForegroundColor Green
    $results += @{Name = "Login ADMIN"; Status = 200; Pass = $true; Response = "Token received, Role: $($loginResp.role)" }
}
catch {
    Write-Host "  Status: FAIL | Error: $($_.Exception.Message)" -ForegroundColor Red
    $results += @{Name = "Login ADMIN"; Status = 0; Pass = $false; Response = $_.Exception.Message }
    $adminToken = $null
}

# B1) CREATE PROJECT (MANAGER)
Write-Host "B1) Testing CREATE PROJECT (MANAGER)..." -ForegroundColor Yellow
if ($managerToken) {
    $projectBody = @{name = "Test Project $(Get-Random)"; description = "A test project"; dataType = "IMAGE"; status = "ACTIVE" } | ConvertTo-Json
    $r = Test-Endpoint -Name "Create Project" -Method "POST" -Url "$baseUrl/api/projects" -Body $projectBody -Token $managerToken -ExpectedStatus 201
    Write-Host "  Status: $($r.Status) | Pass: $($r.Pass)" -ForegroundColor $(if ($r.Pass) { "Green" }else { "Red" })
    $results += $r
}
else {
    Write-Host "  SKIPPED - No manager token" -ForegroundColor Gray
    $results += @{Name = "Create Project"; Status = 0; Pass = $false; Response = "SKIPPED" }
}

# B2) LIST PROJECTS (MANAGER)
Write-Host "B2) Testing LIST PROJECTS (MANAGER)..." -ForegroundColor Yellow
if ($managerToken) {
    $r = Test-Endpoint -Name "List Projects" -Method "GET" -Url "$baseUrl/api/projects/my-projects" -Token $managerToken
    Write-Host "  Status: $($r.Status) | Pass: $($r.Pass)" -ForegroundColor $(if ($r.Pass) { "Green" }else { "Red" })
    $results += $r
}
else {
    Write-Host "  SKIPPED - No manager token" -ForegroundColor Gray
    $results += @{Name = "List Projects"; Status = 0; Pass = $false; Response = "SKIPPED" }
}

# C1) CREATE LABEL (ADMIN)
Write-Host "C1) Testing CREATE LABEL (ADMIN)..." -ForegroundColor Yellow
if ($adminToken) {
    $labelBody = @{name = "Test Label $(Get-Random)"; description = "A test label"; color = "#FF5733"; isActive = $true } | ConvertTo-Json
    $r = Test-Endpoint -Name "Create Label" -Method "POST" -Url "$baseUrl/api/labels" -Body $labelBody -Token $adminToken -ExpectedStatus 201
    Write-Host "  Status: $($r.Status) | Pass: $($r.Pass)" -ForegroundColor $(if ($r.Pass) { "Green" }else { "Red" })
    $results += $r
}
else {
    Write-Host "  SKIPPED - No admin token" -ForegroundColor Gray
    $results += @{Name = "Create Label"; Status = 0; Pass = $false; Response = "SKIPPED" }
}

# C1b) LIST LABELS
Write-Host "C1b) Testing LIST LABELS..." -ForegroundColor Yellow
$r = Test-Endpoint -Name "List Labels" -Method "GET" -Url "$baseUrl/api/labels"
Write-Host "  Status: $($r.Status) | Pass: $($r.Pass)" -ForegroundColor $(if ($r.Pass) { "Green" }else { "Red" })
$results += $r

# C2) CREATE POLICY (MANAGER - per backend)
Write-Host "C2) Testing CREATE POLICY (MANAGER)..." -ForegroundColor Yellow
if ($managerToken) {
    $policyBody = @{name = "Test Policy $(Get-Random)"; description = "A test policy"; errorLevel = "MEDIUM"; condition = "test condition" } | ConvertTo-Json
    $r = Test-Endpoint -Name "Create Policy" -Method "POST" -Url "$baseUrl/api/policies" -Body $policyBody -Token $managerToken
    Write-Host "  Status: $($r.Status) | Pass: $($r.Pass)" -ForegroundColor $(if ($r.Pass) { "Green" }else { "Red" })
    $results += $r
}
else {
    Write-Host "  SKIPPED - No manager token" -ForegroundColor Gray
    $results += @{Name = "Create Policy"; Status = 0; Pass = $false; Response = "SKIPPED" }
}

# C2b) LIST POLICIES
Write-Host "C2b) Testing LIST POLICIES (MANAGER)..." -ForegroundColor Yellow
if ($managerToken) {
    $r = Test-Endpoint -Name "List Policies" -Method "GET" -Url "$baseUrl/api/policies" -Token $managerToken
    Write-Host "  Status: $($r.Status) | Pass: $($r.Pass)" -ForegroundColor $(if ($r.Pass) { "Green" }else { "Red" })
    $results += $r
}
else {
    Write-Host "  SKIPPED - No manager token" -ForegroundColor Gray
}

# C3) VIEW USERS (ADMIN)
Write-Host "C3) Testing VIEW USERS (ADMIN)..." -ForegroundColor Yellow
if ($adminToken) {
    $r = Test-Endpoint -Name "View Users" -Method "GET" -Url "$baseUrl/api/users" -Token $adminToken
    Write-Host "  Status: $($r.Status) | Pass: $($r.Pass)" -ForegroundColor $(if ($r.Pass) { "Green" }else { "Red" })
    $results += $r
}
else {
    Write-Host "  SKIPPED - No admin token" -ForegroundColor Gray
    $results += @{Name = "View Users"; Status = 0; Pass = $false; Response = "SKIPPED" }
}

# C4) CREATE USER (ADMIN)
Write-Host "C4) Testing CREATE USER (ADMIN)..." -ForegroundColor Yellow
if ($adminToken) {
    $userBody = @{username = "createduser$(Get-Random)"; email = "created$(Get-Random)@test.com"; password = "Pass123!"; fullName = "Created User"; roleId = 1 } | ConvertTo-Json
    $r = Test-Endpoint -Name "Create User" -Method "POST" -Url "$baseUrl/api/users" -Body $userBody -Token $adminToken
    Write-Host "  Status: $($r.Status) | Pass: $($r.Pass)" -ForegroundColor $(if ($r.Pass) { "Green" }else { "Red" })
    $results += $r
}
else {
    Write-Host "  SKIPPED - No admin token" -ForegroundColor Gray
    $results += @{Name = "Create User"; Status = 0; Pass = $false; Response = "SKIPPED" }
}

# D1) ACTIVITY LOGS (ADMIN)
Write-Host "D1) Testing ACTIVITY LOGS (ADMIN)..." -ForegroundColor Yellow
if ($adminToken) {
    $r = Test-Endpoint -Name "Activity Logs" -Method "GET" -Url "$baseUrl/api/activity-logs" -Token $adminToken
    Write-Host "  Status: $($r.Status) | Pass: $($r.Pass)" -ForegroundColor $(if ($r.Pass) { "Green" }else { "Red" })
    $results += $r
}
else {
    Write-Host "  SKIPPED - No admin token" -ForegroundColor Gray
    $results += @{Name = "Activity Logs"; Status = 0; Pass = $false; Response = "SKIPPED" }
}

# RBAC TEST: MANAGER trying ADMIN endpoint
Write-Host ""
Write-Host "RBAC Test: MANAGER accessing /api/users (ADMIN-only)..." -ForegroundColor Yellow
if ($managerToken) {
    $r = Test-Endpoint -Name "RBAC: Manager->Admin" -Method "GET" -Url "$baseUrl/api/users" -Token $managerToken
    $rbacPass = $r.Status -eq 403 -or $r.Status -eq 401
    Write-Host "  Status: $($r.Status) | Should be 403: $rbacPass" -ForegroundColor $(if ($rbacPass) { "Green" }else { "Red" })
}

# Summary
Write-Host ""
Write-Host "====== SUMMARY ======" -ForegroundColor Cyan
$passed = ($results | Where-Object { $_.Pass }).Count
$total = $results.Count
Write-Host "Passed: $passed / $total" -ForegroundColor $(if ($passed -eq $total) { "Green" }elseif ($passed -gt $total / 2) { "Yellow" }else { "Red" })
Write-Host ""
Write-Host "Results Table:" -ForegroundColor Cyan
$results | ForEach-Object { 
    $color = if ($_.Pass) { "Green" }else { "Red" }
    Write-Host ("  {0,-25} | {1,4} | {2}" -f $_.Name, $_.Status, $(if ($_.Pass) { "PASS" }else { "FAIL" })) -ForegroundColor $color
}
