# Sprint 1 Verification Script
$baseUrl = "http://localhost:8080"
$managerEmail = "manager_demo_" + (Get-Random) + "@test.com"
$managerUser = $managerEmail.Split('@')[0]
$password = "Test1234!"

Write-Host ">>> STARTING SPRINT 1 VERIFICATION <<<" -ForegroundColor Cyan

# 1. Register Manager
Write-Host "`n[TEST 1.0] Register new Manager ($managerEmail)..."
$registerPayload = @{
    username = $managerUser
    email    = $managerEmail
    password = $password
    fullName = "Demo Manager"
    roleId   = 2 # MANAGER role
} | ConvertTo-Json

try {
    $regResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $registerPayload -ContentType "application/json" -ErrorAction Stop
    Write-Host "   PASS: Registration successful ($($regResponse))" -ForegroundColor Green
}
catch {
    Write-Host "   FAIL: Registration failed. $_" -ForegroundColor Red
    exit
}

# 2. Login
Write-Host "`n[TEST 1.1] Login as Manager..."
$loginPayload = @{
    username = $managerUser
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json" -ErrorAction Stop
    $token = $loginResponse.accessToken
    if ([string]::IsNullOrWhiteSpace($token)) {
        Write-Host "   FAIL: Token not found in response." -ForegroundColor Red
        exit
    }
    Write-Host "   PASS: Login successful. Token received." -ForegroundColor Green
}
catch {
    Write-Host "   FAIL: Login failed. $_" -ForegroundColor Red
    exit
}

$headers = @{
    Authorization = "Bearer $token"
}

# 3. Create Project
Write-Host "`n[TEST 3.1] Create New Project..."
$projectPayload = @{
    name        = "Demo Project Sprint 1"
    dataType    = "IMAGE"
    description = "Automated test project"
} | ConvertTo-Json

try {
    $projResponse = Invoke-RestMethod -Uri "$baseUrl/api/projects" -Method Post -Headers $headers -Body $projectPayload -ContentType "application/json" -ErrorAction Stop
    Write-Host "   PASS: Project created. ID: $($projResponse.id) Name: $($projResponse.name)" -ForegroundColor Green
}
catch {
    Write-Host "   FAIL: Create Project failed. $_" -ForegroundColor Red
}

# 4. List Projects
Write-Host "`n[TEST 3.2] List Projects..."
try {
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/api/projects/my-projects" -Method Get -Headers $headers -ErrorAction Stop
    $count = $listResponse.Count
    if ($count -ge 1) {
        Write-Host "   PASS: List projects successful. Found $count projects." -ForegroundColor Green
        $listResponse | Format-Table id, name, type, status, managerId
    }
    else {
        Write-Host "   FAIL: Project list is empty after creation." -ForegroundColor Red
    }
}
catch {
    Write-Host "   FAIL: List Projects failed. $_" -ForegroundColor Red
}

Write-Host "`n>>> SPRINT 1 VERIFICATION COMPLETE <<<" -ForegroundColor Cyan
