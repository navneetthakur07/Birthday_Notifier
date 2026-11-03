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
     * Diagnose OAuth 2.0 configuration, token refresh, and Gmail API health.
     */
    @GetMapping("/diagnose")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> diagnoseOAuth() {
        return ResponseEntity.ok(googleOAuth2Service.diagnoseConnection());
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
     * Can receive optional {"targetEmail": "myemail@gmail.com"} to send to a real recipient.
     */
    @PostMapping("/test")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<MessageResponse> sendTestEmail(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody(required = false) Map<String, String> requestBody) {

        if (!googleOAuth2Service.isConfigured()) {
            return ResponseEntity.badRequest().body(
                    new MessageResponse("Google OAuth 2.0 is not configured yet. Please provide Client ID, Secret, and authorize connection.", false)
            );
        }

        // Determine recipient: custom target email > connected email > admin user email
        String recipient = null;
        if (requestBody != null && requestBody.containsKey("targetEmail") && !requestBody.get("targetEmail").isBlank()) {
            recipient = requestBody.get("targetEmail").trim();
        }

        if (recipient == null || recipient.isBlank()) {
            recipient = googleOAuth2Service.getEffectiveConnectedEmail();
        }

        if (recipient == null || recipient.isBlank()) {
            recipient = currentUser.getUsername();
        }

        try {
            String sender = googleOAuth2Service.getEffectiveConnectedEmail();
            if (sender == null || sender.isBlank()) {
                sender = recipient;
            }

            String msgId = googleOAuth2Service.sendEmailViaOAuth2(
                    recipient,
                    sender,
                    "Birthday Notifier Bot",
                    "🧪 [Verification] Google OAuth 2.0 Email Engine Verified!",
                    """
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
                        <table width="100%%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <td align="center">
                                    <table width="560" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                                        <tr>
                                            <td style="background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); padding: 28px 24px; text-align: center; color: #ffffff;">
                                                <div style="font-size: 40px; margin-bottom: 6px;">🎉</div>
                                                <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Google OAuth 2.0 Delivery Verified!</h1>
                                                <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">Dispatched via official Google Gmail REST API v1</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 28px 24px;">
                                                <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
                                                    Congratulations! Your Birthday Notifier application successfully authenticated with Google's OAuth 2.0 token server and delivered this email via HTTPS REST (Port 443).
                                                </p>
                                                <div style="background-color: #f1f5f9; border-radius: 10px; padding: 14px; margin: 18px 0; font-size: 13px; color: #475569;">
                                                    <p style="margin: 3px 0;"><strong>Recipient:</strong> %s</p>
                                                    <p style="margin: 3px 0;"><strong>Authorized Sender:</strong> %s</p>
                                                    <p style="margin: 3px 0;"><strong>Transport:</strong> OAuth 2.0 Bearer Token (HTTPS REST)</p>
                                                </div>
                                                <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
                                                    Your scheduled <strong>23:50 Midnight-Eve notifications</strong> are now ready to be delivered reliably without any SMTP port restrictions.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                    """.formatted(recipient, sender)
            );

            return ResponseEntity.ok(new MessageResponse("Success! Verified test email delivered to " + recipient + " (Google Message ID: " + msgId + ")", true));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new MessageResponse("OAuth 2.0 delivery failed: " + ex.getMessage(), false));
        }
    }
}
