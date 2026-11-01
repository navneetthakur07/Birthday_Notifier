$proc = Start-Process java -ArgumentList "-jar", "backend\target\birthday-notifier-backend-1.0.0.jar" -RedirectStandardOutput "server_out.log" -RedirectStandardError "server_err.log" -PassThru

Write-Host "Waiting for server to start on port 8080..."
$started = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method Get -TimeoutSec 2
        if ($res.status -eq "UP") {
            $started = $true
            Write-Host "Server is UP! Response: $($res | ConvertTo-Json -Compress)"
            break
        }
    } catch {
        # still booting
    }
}

if (-not $started) {
    Write-Error "Server failed to start in 30 seconds"
    if (Test-Path "server_err.log") { Get-Content "server_err.log" }
    if (Test-Path "server_out.log") { Get-Content "server_out.log" }
    try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
    exit 1
}

try {
    # 1. Test Public OAuth 2.0 Status
    Write-Host "`n--- Testing Google OAuth 2.0 Status Endpoint ---"
    $oauthStatus = Invoke-RestMethod -Uri "http://localhost:8080/api/oauth2/status" -Method Get
    Write-Host "OAuth 2.0 Status: Provider=$($oauthStatus.provider), Connected=$($oauthStatus.connected)"

    # 2. Admin Sign In
    Write-Host "`n--- Testing Admin Sign In ---"
    $adminLoginBody = @{ email = "admin@birthday.com"; password = "Admin@123" } | ConvertTo-Json
    $adminRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/signin" -Method Post -Body $adminLoginBody -ContentType "application/json"
    Write-Host "Admin Logged in! Name: $($adminRes.fullName), Roles: $($adminRes.roles -join ',')"
    $adminToken = $adminRes.token
    $adminHeaders = @{ Authorization = "Bearer $adminToken" }

    # 3. Google OAuth 2.0 Sign-In / SSO
    Write-Host "`n--- Testing Google OAuth 2.0 Login / SSO ---"
    $googleLoginBody = @{ email = "google.user@example.com"; fullName = "Taylor Swift"; googleId = "google-sub-12345" } | ConvertTo-Json
    $googleRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/google-login" -Method Post -Body $googleLoginBody -ContentType "application/json"
    Write-Host "Google User Logged in! Name: $($googleRes.fullName), Email: $($googleRes.email)"

    # 4. Save OAuth 2.0 Configuration as Admin
    Write-Host "`n--- Testing Google OAuth 2.0 Configuration Update ---"
    $cfgBody = @{
        clientId = "sample-client-id.apps.googleusercontent.com";
        clientSecret = "sample-client-secret";
        refreshToken = "1//sample-refresh-token";
        connectedEmail = "admin.sender@gmail.com"
    } | ConvertTo-Json
    $cfgRes = Invoke-RestMethod -Uri "http://localhost:8080/api/oauth2/config" -Method Post -Body $cfgBody -Headers $adminHeaders -ContentType "application/json"
    Write-Host "OAuth Config Response: $($cfgRes.message)"

    # Verify updated status
    $updatedStatus = Invoke-RestMethod -Uri "http://localhost:8080/api/oauth2/status" -Method Get
    Write-Host "Updated OAuth Status: Connected=$($updatedStatus.connected), Email=$($updatedStatus.connectedEmail)"

    # 5. User Sign In
    Write-Host "`n--- Testing User Sign In ---"
    $userLoginBody = @{ email = "user@birthday.com"; password = "User@123" } | ConvertTo-Json
    $userRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/signin" -Method Post -Body $userLoginBody -ContentType "application/json"
    Write-Host "User Logged in! Name: $($userRes.fullName), Roles: $($userRes.roles -join ',')"
    $userToken = $userRes.token
    $userHeaders = @{ Authorization = "Bearer $userToken" }

    # 6. User Get Birthdays
    Write-Host "`n--- Testing User Birthdays Retrieval ---"
    $birthdays = Invoke-RestMethod -Uri "http://localhost:8080/api/birthdays" -Method Get -Headers $userHeaders
    Write-Host "Retrieved $($birthdays.Count) birthdays for user:"
    foreach ($b in $birthdays) {
        Write-Host " - $($b.personName) ($($b.relationship)): $($b.formattedBirthday) (Days until: $($b.daysUntil), Tomorrow: $($b.tomorrow))"
    }

    # 7. Trigger Test Reminder (Exercises EmailService with OAuth 2.0 priority)
    if ($birthdays.Count -gt 0) {
        $targetId = $birthdays[0].id
        Write-Host "`n--- Testing Manual Reminder Trigger for $($birthdays[0].personName) ---"
        $remRes = Invoke-RestMethod -Uri "http://localhost:8080/api/birthdays/$targetId/test-reminder" -Method Post -Headers $userHeaders
        Write-Host "Reminder dispatch result: $($remRes.message)"
    }

    # 8. Admin Trigger 23:50 Scheduler Job
    Write-Host "`n--- Testing Admin Trigger of 23:50 Scheduler ---"
    $schedRes = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/trigger-scheduler" -Method Post -Headers $adminHeaders
    Write-Host "Scheduler Job result: $($schedRes.message)"

    # 9. Admin Get System Stats and Notification Logs
    Write-Host "`n--- Testing Admin Stats and Delivery Logs ---"
    $stats = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/stats" -Method Get -Headers $adminHeaders
    Write-Host "System Stats: $($stats | ConvertTo-Json -Compress)"

    $logs = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/logs?limit=5" -Method Get -Headers $adminHeaders
    Write-Host "Retrieved $($logs.Count) delivery logs:"
    foreach ($l in $logs) {
        Write-Host " - Recipient: $($l.recipientEmail), Person: $($l.personName), Status: $($l.status)"
    }

    Write-Host "`nALL BACKEND API & GOOGLE OAUTH 2.0 TESTS COMPLETED SUCCESSFULLY! 🎉"

} finally {
    Write-Host "Stopping backend test server..."
    try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
}
