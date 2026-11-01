package com.birthdaynotifier.controller;

import com.birthdaynotifier.dto.MessageResponse;
import com.birthdaynotifier.dto.OAuth2CallbackRequest;
import com.birthdaynotifier.dto.OAuth2ConfigDto;
import com.birthdaynotifier.security.UserDetailsImpl;
import com.birthdaynotifier.service.GoogleOAuth2Service;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/oauth2")
public class OAuth2Controller {

    private final GoogleOAuth2Service googleOAuth2Service;

    @Autowired
    public OAuth2Controller(GoogleOAuth2Service googleOAuth2Service) {
        this.googleOAuth2Service = googleOAuth2Service;
    }

    /**
     * Get OAuth 2.0 connection status and public metadata.
     */
    @GetMapping("/status")
    public ResponseEntity<OAuth2ConfigDto> getOAuthStatus() {
        return ResponseEntity.ok(googleOAuth2Service.getConfigStatus());
    }

    /**
     * Get Google OAuth 2.0 authorization URL for 1-click connect.
     */
    @GetMapping("/auth-url")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, String>> getAuthUrl(@RequestParam(required = false) String redirectUri) {
        String url = googleOAuth2Service.buildAuthorizationUrl(redirectUri);
        return ResponseEntity.ok(Map.of("authUrl", url));
    }

    /**
     * Exchange authorization code from Google OAuth 2.0 consent redirect.
     */
    @PostMapping("/callback")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> handleOAuthCallback(@Valid @RequestBody OAuth2CallbackRequest request) {
        Map<String, Object> result = googleOAuth2Service.exchangeCodeForTokens(request.getCode(), request.getRedirectUri());
        return ResponseEntity.ok(result);
    }

    /**
     * Save or update Google OAuth 2.0 client credentials.
     */
    @PostMapping("/config")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<MessageResponse> saveCredentials(@RequestBody OAuth2ConfigDto dto) {
        googleOAuth2Service.saveCredentials(dto.getClientId(), dto.getClientSecret(), dto.getRefreshToken(), dto.getConnectedEmail());
        return ResponseEntity.ok(new MessageResponse("Google OAuth 2.0 configuration saved successfully!", true));
    }

    /**
     * Disconnect Google OAuth 2.0 connection.
     */
    @PostMapping("/disconnect")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<MessageResponse> disconnectOAuth() {
        googleOAuth2Service.disconnect();
        return ResponseEntity.ok(new MessageResponse("Google OAuth 2.0 disconnected.", true));
    }

    /**
     * Send a test email via Google OAuth 2.0 to verify setup.
     */
    @PostMapping("/test")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<MessageResponse> sendTestEmail(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        if (!googleOAuth2Service.isConfigured()) {
            return ResponseEntity.badRequest().body(
                    new MessageResponse("Google OAuth 2.0 is not configured yet. Please provide Client ID, Secret, and authorize connection.", false)
            );
        }

        try {
            String sender = googleOAuth2Service.getEffectiveConnectedEmail();
            if (sender == null || sender.isBlank()) {
                sender = "noreply@birthday.com";
            }

            String msgId = googleOAuth2Service.sendEmailViaOAuth2(
                    currentUser.getUsername(),
                    sender,
                    "Birthday Notifier Bot",
                    "🧪 [Verification] Google OAuth 2.0 Email Engine Verified!",
                    """
                    <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                        <h2 style="color: #6366f1;">🎉 Google OAuth 2.0 Email Engine is Working!</h2>
                        <p>This email was successfully dispatched via the official <strong>Google Gmail REST API (v1)</strong> using OAuth 2.0 methodology.</p>
                        <p>Your Birthday Notifier application is now ready to send automated 23:50 Midnight-Eve alerts with zero SMTP dependency!</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #94a3b8;">Delivered to: %s &bull; Method: OAuth 2.0 Bearer Token</p>
                    </div>
                    """.formatted(currentUser.getUsername())
            );

            return ResponseEntity.ok(new MessageResponse("Verified! Email dispatched via Google OAuth 2.0 (Gmail Message ID: " + msgId + ")", true));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new MessageResponse("OAuth 2.0 delivery failed: " + ex.getMessage(), false));
        }
    }
}
