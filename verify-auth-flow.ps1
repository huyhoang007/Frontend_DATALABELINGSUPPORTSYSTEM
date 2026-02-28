# Verify End-to-End Auth Flow
$baseUrl = "http://localhost:8080"
$username = "testuser"
$password = "Test123!"

Write-Host "1. Testing Login..." -ForegroundColor Cyan
$loginUrl = "$baseUrl/api/auth/login"
$body = @{
    username = $username
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $body -ContentType "application/json"
    Write-Host "   Login Success!" -ForegroundColor Green
    $token = $loginResponse.accessToken
    Write-Host "   Token received (starts with): $($token.Substring(0, 10))..." -ForegroundColor Gray
}
catch {
    Write-Error "   Login Failed: $_"
    exit
}

Write-Host "`n2. Testing Protected Endpoint (/api/users/me)..." -ForegroundColor Cyan
$protectedUrl = "$baseUrl/api/users/me"
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $profileResponse = Invoke-RestMethod -Uri $protectedUrl -Method Get -Headers $headers
    Write-Host "   Access Success!" -ForegroundColor Green
    Write-Host "   User Profile: $($profileResponse.username) ($($profileResponse.email))" -ForegroundColor Gray
}
catch {
    Write-Error "   Access Failed: $_"
    exit
}

Write-Host "`nVerified Successfully." -ForegroundColor Green
