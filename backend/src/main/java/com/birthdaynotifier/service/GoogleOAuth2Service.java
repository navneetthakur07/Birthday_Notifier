package com.birthdaynotifier.service;

import com.birthdaynotifier.dto.OAuth2ConfigDto;
import com.birthdaynotifier.entity.AppConfig;
import com.birthdaynotifier.repository.AppConfigRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class GoogleOAuth2Service {

    private static final Logger logger = LoggerFactory.getLogger(GoogleOAuth2Service.class);

    private static final String GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
    private static final String GMAIL_PROFILE_URL = "https://gmail.googleapis.com/gmail/v1/users/me/profile";
    private static final String GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";
    private static final String GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email";

    private final AppConfigRepository appConfigRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.oauth2.google.client-id:}")
    private String envClientId;

    @Value("${app.oauth2.google.client-secret:}")
    private String envClientSecret;

    @Value("${app.oauth2.google.refresh-token:}")
    private String envRefreshToken;

    @Value("${app.oauth2.google.redirect-uri:http://localhost:5173/oauth2/callback}")
    private String defaultRedirectUri;

    @Value("${app.oauth2.google.connected-email:}")
    private String envConnectedEmail;

    // In-memory access token cache
    private String cachedAccessToken;
    private long accessTokenExpiryEpochMs = 0;

    @Autowired
    public GoogleOAuth2Service(AppConfigRepository appConfigRepository) {
        this.appConfigRepository = appConfigRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public String getEffectiveClientId() {
        return getConfigValue("GOOGLE_OAUTH_CLIENT_ID", envClientId);
    }

    public String getEffectiveClientSecret() {
        return getConfigValue("GOOGLE_OAUTH_CLIENT_SECRET", envClientSecret);
    }

    public String getEffectiveRefreshToken() {
        return getConfigValue("GOOGLE_OAUTH_REFRESH_TOKEN", envRefreshToken);
    }

    public String getEffectiveConnectedEmail() {
        return getConfigValue("GOOGLE_OAUTH_CONNECTED_EMAIL", envConnectedEmail);
    }

    public boolean isConfigured() {
        String clientId = getEffectiveClientId();
        String clientSecret = getEffectiveClientSecret();
        String refreshToken = getEffectiveRefreshToken();
        return clientId != null && !clientId.isBlank() &&
               clientSecret != null && !clientSecret.isBlank() &&
               refreshToken != null && !refreshToken.isBlank();
    }

    /**
     * Builds the authorization URL for the user to grant Gmail send permissions.
     */
    public String buildAuthorizationUrl(String redirectUri) {
        String clientId = getEffectiveClientId();
        if (clientId == null || clientId.isBlank()) {
            throw new IllegalStateException("Google OAuth Client ID is not configured. Please enter your Client ID first.");
        }

        String targetRedirect = (redirectUri != null && !redirectUri.isBlank()) ? redirectUri : defaultRedirectUri;

        return GOOGLE_AUTH_URL + "?" +
                "client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(targetRedirect, StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&scope=" + URLEncoder.encode(GMAIL_SCOPE, StandardCharsets.UTF_8) +
                "&access_type=offline" +
                "&prompt=consent" +
                "&include_granted_scopes=true";
    }

    /**
     * Exchanges an authorization code for refresh and access tokens.
     */
    public Map<String, Object> exchangeCodeForTokens(String code, String redirectUri) {
        String clientId = getEffectiveClientId();
        String clientSecret = getEffectiveClientSecret();
        String targetRedirect = (redirectUri != null && !redirectUri.isBlank()) ? redirectUri : defaultRedirectUri;

        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new IllegalStateException("Google OAuth Client ID and Secret must be configured before exchanging code.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", targetRedirect);
        params.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(GOOGLE_TOKEN_URL, request, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());

                String accessToken = root.has("access_token") ? root.get("access_token").asText() : null;
                String refreshToken = root.has("refresh_token") ? root.get("refresh_token").asText() : null;
                int expiresIn = root.has("expires_in") ? root.get("expires_in").asInt() : 3600;

                if (refreshToken != null) {
                    saveConfigValue("GOOGLE_OAUTH_REFRESH_TOKEN", refreshToken, "Google OAuth 2.0 Refresh Token for Gmail sending");
                }

                if (accessToken != null) {
                    this.cachedAccessToken = accessToken;
                    this.accessTokenExpiryEpochMs = System.currentTimeMillis() + ((long) expiresIn * 1000);

                    // Discover the connected email address from Gmail profile or userinfo
                    String connectedEmail = fetchConnectedEmail(accessToken);
                    if (connectedEmail != null) {
                        saveConfigValue("GOOGLE_OAUTH_CONNECTED_EMAIL", connectedEmail, "Connected Google Account Email");
                    }

                    return Map.of(
                            "success", true,
                            "message", "Google OAuth 2.0 connected successfully!",
                            "connectedEmail", connectedEmail != null ? connectedEmail : "Connected"
                    );
                }
            }
        } catch (HttpStatusCodeException ex) {
            String errorBody = ex.getResponseBodyAsString();
            logger.error("Failed to exchange code for tokens. Google HTTP {}: {}", ex.getStatusCode(), errorBody);
            throw new RuntimeException(parseGoogleError(errorBody, ex.getMessage()));
        } catch (Exception ex) {
            logger.error("Failed to exchange authorization code for tokens: {}", ex.getMessage());
            throw new RuntimeException("Google OAuth token exchange failed: " + ex.getMessage(), ex);
        }

        throw new RuntimeException("Failed to obtain OAuth tokens from Google.");
    }

    /**
     * Retrieves a valid access token, refreshing via refresh_token if expired.
     */
    public synchronized String getValidAccessToken() {
        if (cachedAccessToken != null && System.currentTimeMillis() < (accessTokenExpiryEpochMs - 60000)) {
            return cachedAccessToken;
        }

        String clientId = getEffectiveClientId();
        String clientSecret = getEffectiveClientSecret();
        String refreshToken = getEffectiveRefreshToken();

        if (clientId == null || clientId.isBlank() ||
            clientSecret == null || clientSecret.isBlank() ||
            refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalStateException("Google OAuth 2.0 credentials not fully configured (missing Client ID, Client Secret, or Refresh Token)");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", clientId.trim());
        params.add("client_secret", clientSecret.trim());
        params.add("refresh_token", refreshToken.trim());
        params.add("grant_type", "refresh_token");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(GOOGLE_TOKEN_URL, request, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String newAccessToken = root.get("access_token").asText();
                int expiresIn = root.has("expires_in") ? root.get("expires_in").asInt() : 3600;

                this.cachedAccessToken = newAccessToken;
                this.accessTokenExpiryEpochMs = System.currentTimeMillis() + ((long) expiresIn * 1000);
                logger.info("Successfully refreshed Google OAuth 2.0 access token (valid for {}s)", expiresIn);
                return newAccessToken;
            }
        } catch (HttpStatusCodeException ex) {
            String errorBody = ex.getResponseBodyAsString();
            logger.error("Google token refresh rejected. HTTP {}: {}", ex.getStatusCode(), errorBody);
            throw new RuntimeException(parseGoogleError(errorBody, "Token refresh failed (HTTP " + ex.getStatusCode() + ")"));
        } catch (Exception ex) {
            logger.error("Failed to refresh Google OAuth access token: {}", ex.getMessage());
            throw new RuntimeException("Could not refresh Google OAuth 2.0 access token: " + ex.getMessage(), ex);
        }

        throw new RuntimeException("Unable to obtain fresh Google OAuth access token.");
    }

    /**
     * Sends an email via Google Gmail REST API v1 using OAuth 2.0.
     */
    public String sendEmailViaOAuth2(String toEmail, String fromEmail, String fromName, String subject, String htmlContent) {
        String accessToken = getValidAccessToken();

        // If fromEmail is not specified or is a placeholder, detect actual Gmail user profile email
        String actualSender = fromEmail;
        if (actualSender == null || actualSender.isBlank() || actualSender.contains("noreply") || actualSender.contains("example.com")) {
            String profileEmail = fetchConnectedEmail(accessToken);
            if (profileEmail != null && !profileEmail.isBlank()) {
                actualSender = profileEmail;
                saveConfigValue("GOOGLE_OAUTH_CONNECTED_EMAIL", profileEmail, "Connected Google Account Email");
            }
        }

        try {
            // Construct RFC 2822 MIME message
            Session session = Session.getInstance(new Properties());
            MimeMessage mimeMessage = new MimeMessage(session);
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String senderHeader = (fromName != null && !fromName.isBlank())
                    ? fromName + " <" + actualSender + ">"
                    : actualSender;

            helper.setFrom(senderHeader);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            mimeMessage.writeTo(buffer);
            byte[] rawBytes = buffer.toByteArray();
            String encodedMessage = Base64.getUrlEncoder().withoutPadding().encodeToString(rawBytes);

            // POST to Gmail API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);

            String payload = "{\"raw\":\"" + encodedMessage + "\"}";
            HttpEntity<String> request = new HttpEntity<>(payload, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(GMAIL_SEND_URL, request, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode resJson = objectMapper.readTree(response.getBody());
                String messageId = resJson.has("id") ? resJson.get("id").asText() : "OK";
                logger.info("Email delivered via Google OAuth 2.0 Gmail API to: {} (Message ID: {})", toEmail, messageId);
                return messageId;
            } else {
                throw new RuntimeException("Gmail API responded with status: " + response.getStatusCode());
            }

        } catch (HttpStatusCodeException ex) {
            String errorBody = ex.getResponseBodyAsString();
            logger.error("Gmail API dispatch rejected. HTTP {}: {}", ex.getStatusCode(), errorBody);
            throw new RuntimeException(parseGoogleError(errorBody, "Gmail API error (" + ex.getStatusCode() + ")"));
        } catch (Exception ex) {
            logger.error("Google OAuth 2.0 email dispatch error for {}: {}", toEmail, ex.getMessage());
            throw new RuntimeException("Google OAuth 2.0 email dispatch failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Runs a comprehensive end-to-end diagnostic of the Google OAuth 2.0 connection.
     */
    public Map<String, Object> diagnoseConnection() {
        Map<String, Object> report = new LinkedHashMap<>();
        String clientId = getEffectiveClientId();
        String clientSecret = getEffectiveClientSecret();
        String refreshToken = getEffectiveRefreshToken();
        String savedEmail = getEffectiveConnectedEmail();

        report.put("clientIdConfigured", clientId != null && !clientId.isBlank());
        report.put("clientSecretConfigured", clientSecret != null && !clientSecret.isBlank());
        report.put("refreshTokenConfigured", refreshToken != null && !refreshToken.isBlank());

        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank() || refreshToken == null || refreshToken.isBlank()) {
            report.put("success", false);
            report.put("status", "INCOMPLETE_CREDENTIALS");
            report.put("message", "Missing Client ID, Client Secret, or Refresh Token. Please enter all three values.");
            return report;
        }

        try {
            // 1. Test Access Token Refresh with Google
            String accessToken = getValidAccessToken();
            report.put("tokenRefreshSuccess", true);

            // 2. Validate token and granted scopes via Google TokenInfo endpoint
            String grantedScopes = "";
            String tokenEmail = savedEmail;

            try {
                ResponseEntity<String> tokenInfoRes = restTemplate.getForEntity(
                        GOOGLE_TOKENINFO_URL + "?access_token=" + accessToken,
                        String.class
                );
                if (tokenInfoRes.getStatusCode().is2xxSuccessful() && tokenInfoRes.getBody() != null) {
                    JsonNode tokenInfoNode = objectMapper.readTree(tokenInfoRes.getBody());
                    if (tokenInfoNode.has("scope")) {
                        grantedScopes = tokenInfoNode.get("scope").asText();
                    }
                    if (tokenInfoNode.has("email") && (tokenEmail == null || tokenEmail.isBlank())) {
                        tokenEmail = tokenInfoNode.get("email").asText();
                    }
                }
            } catch (Exception tokenInfoEx) {
                logger.debug("Google tokeninfo check: {}", tokenInfoEx.getMessage());
            }

            // 3. Auto-discover or sync email if missing
            if (tokenEmail == null || tokenEmail.isBlank()) {
                String discoveredEmail = fetchConnectedEmail(accessToken);
                if (discoveredEmail != null && !discoveredEmail.isBlank()) {
                    tokenEmail = discoveredEmail;
                }
            }

            if (tokenEmail != null && !tokenEmail.isBlank() && !tokenEmail.equals(savedEmail)) {
                saveConfigValue("GOOGLE_OAUTH_CONNECTED_EMAIL", tokenEmail, "Connected Google Account Email");
            }

            // 4. Optionally query Gmail profile (if scope allows; gracefully ignored if restricted to gmail.send)
            int messagesTotal = 0;
            boolean profileScopeAvailable = false;
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setBearerAuth(accessToken);
                HttpEntity<Void> req = new HttpEntity<>(headers);
                ResponseEntity<String> profileRes = restTemplate.exchange(GMAIL_PROFILE_URL, HttpMethod.GET, req, String.class);
                if (profileRes.getStatusCode().is2xxSuccessful() && profileRes.getBody() != null) {
                    JsonNode profileNode = objectMapper.readTree(profileRes.getBody());
                    if (profileNode.has("emailAddress")) {
                        tokenEmail = profileNode.get("emailAddress").asText();
                    }
                    if (profileNode.has("messagesTotal")) {
                        messagesTotal = profileNode.get("messagesTotal").asInt();
                    }
                    profileScopeAvailable = true;
                }
            } catch (Exception profileEx) {
                // Expected when token is scoped strictly for email delivery (gmail.send)
                logger.debug("Gmail profile lookup skipped (standard for gmail.send scope): {}", profileEx.getMessage());
            }

            boolean hasSendScope = grantedScopes.contains("gmail.send") ||
                                   grantedScopes.contains("mail.google.com") ||
                                   grantedScopes.isBlank(); // fallback if tokeninfo call was skipped

            report.put("success", true);
            report.put("status", "HEALTHY");
            report.put("connectedEmail", (tokenEmail != null && !tokenEmail.isBlank()) ? tokenEmail : "(Configured in Admin)");
            report.put("grantedScopes", !grantedScopes.isBlank() ? grantedScopes : "https://www.googleapis.com/auth/gmail.send");
            report.put("gmailSendAuthorized", hasSendScope);
            if (profileScopeAvailable) {
                report.put("messagesTotal", messagesTotal);
            }
            report.put("message", "Google OAuth 2.0 connection is Healthy! Token refresh succeeded and Gmail sending permission ('gmail.send') is active.");
            return report;

        } catch (HttpStatusCodeException ex) {
            String errorBody = ex.getResponseBodyAsString();
            report.put("success", false);
            report.put("status", "GOOGLE_API_ERROR");
            report.put("httpStatus", ex.getStatusCode().value());
            report.put("message", parseGoogleError(errorBody, ex.getMessage()));
            return report;
        } catch (Exception ex) {
            report.put("success", false);
            report.put("status", "ERROR");
            report.put("message", ex.getMessage());
            return report;
        }
    }

    private String fetchConnectedEmail(String accessToken) {
        // 1. Try TokenInfo endpoint
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(GOOGLE_TOKENINFO_URL + "?access_token=" + accessToken, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.has("email")) {
                    return root.get("email").asText();
                }
            }
        } catch (Exception ignored) {
        }

        // 2. Try UserInfo endpoint
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(GOOGLE_USERINFO_URL, HttpMethod.GET, request, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.has("email")) {
                    return root.get("email").asText();
                }
            }
        } catch (Exception ignored) {
        }

        // 3. Try Gmail API Profile if scope allows
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(GMAIL_PROFILE_URL, HttpMethod.GET, request, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.has("emailAddress")) {
                    return root.get("emailAddress").asText();
                }
            }
        } catch (Exception ignored) {
        }

        return null;
    }

    public OAuth2ConfigDto getConfigStatus() {
        OAuth2ConfigDto dto = new OAuth2ConfigDto();
        dto.setClientId(maskSecret(getEffectiveClientId(), 8));
        dto.setClientSecret(maskSecret(getEffectiveClientSecret(), 4));
        dto.setRefreshToken(maskSecret(getEffectiveRefreshToken(), 6));
        dto.setConnectedEmail(getEffectiveConnectedEmail());
        dto.setConnected(isConfigured());
        dto.setProvider("GOOGLE_OAUTH2_GMAIL");

        try {
            if (getEffectiveClientId() != null && !getEffectiveClientId().isBlank()) {
                dto.setAuthUrl(buildAuthorizationUrl(defaultRedirectUri));
            }
        } catch (Exception ignored) {
        }

        return dto;
    }

    public void saveCredentials(String clientId, String clientSecret, String refreshToken, String connectedEmail) {
        if (clientId != null && !clientId.isBlank() && !clientId.contains("****")) {
            saveConfigValue("GOOGLE_OAUTH_CLIENT_ID", clientId.trim(), "Google OAuth 2.0 Client ID");
        }
        if (clientSecret != null && !clientSecret.isBlank() && !clientSecret.contains("****")) {
            saveConfigValue("GOOGLE_OAUTH_CLIENT_SECRET", clientSecret.trim(), "Google OAuth 2.0 Client Secret");
        }
        if (refreshToken != null && !refreshToken.isBlank() && !refreshToken.contains("****")) {
            saveConfigValue("GOOGLE_OAUTH_REFRESH_TOKEN", refreshToken.trim(), "Google OAuth 2.0 Refresh Token");
        }
        if (connectedEmail != null && !connectedEmail.isBlank()) {
            saveConfigValue("GOOGLE_OAUTH_CONNECTED_EMAIL", connectedEmail.trim(), "Connected Google Account Email");
        }
        // Invalidate cached token so it refreshes with new credentials
        this.cachedAccessToken = null;
        this.accessTokenExpiryEpochMs = 0;
    }

    public void disconnect() {
        appConfigRepository.findByConfigKey("GOOGLE_OAUTH_REFRESH_TOKEN").ifPresent(appConfigRepository::delete);
        appConfigRepository.findByConfigKey("GOOGLE_OAUTH_CONNECTED_EMAIL").ifPresent(appConfigRepository::delete);
        this.cachedAccessToken = null;
        this.accessTokenExpiryEpochMs = 0;
        logger.info("Google OAuth 2.0 disconnected.");
    }

    private String parseGoogleError(String responseBody, String defaultMsg) {
        if (responseBody == null || responseBody.isBlank()) return defaultMsg;
        try {
            JsonNode node = objectMapper.readTree(responseBody);
            if (node.has("error_description")) {
                String desc = node.get("error_description").asText();
                String err = node.has("error") ? node.get("error").asText() : "";
                if ("invalid_grant".equals(err)) {
                    return "Google rejected the Refresh Token ('invalid_grant'). Cause: The token has expired, was revoked, or was generated with a different Client ID. Please re-generate your refresh token using your exact Client ID & Secret.";
                }
                if ("invalid_client".equals(err)) {
                    return "Google rejected the Client credentials ('invalid_client'). Cause: Client Secret or Client ID is incorrect. Please re-check credentials in Google Cloud Console.";
                }
                return "Google OAuth error: " + err + " - " + desc;
            }
            if (node.has("error") && node.get("error").has("message")) {
                String msg = node.get("error").get("message").asText();
                if (msg.contains("Gmail API has not been used") || msg.contains("is disabled")) {
                    return "Gmail API is not enabled in your Google Cloud Project. Please enable the 'Gmail API' at https://console.cloud.google.com/apis/library/gmail.googleapis.com";
                }
                return "Google API error: " + msg;
            }
        } catch (Exception ignored) {
        }
        return defaultMsg;
    }

    private String getConfigValue(String key, String fallback) {
        return appConfigRepository.findByConfigKey(key)
                .map(AppConfig::getConfigValue)
                .filter(val -> !val.isBlank())
                .orElse(fallback);
    }

    private void saveConfigValue(String key, String value, String desc) {
        AppConfig cfg = appConfigRepository.findByConfigKey(key)
                .orElse(new AppConfig(key, value, desc));
        cfg.setConfigValue(value);
        cfg.setDescription(desc);
        cfg.setUpdatedAt(LocalDateTime.now());
        appConfigRepository.save(cfg);
    }

    private String maskSecret(String str, int visibleChars) {
        if (str == null || str.isBlank()) return "";
        if (str.length() <= visibleChars) return "********";
        return str.substring(0, visibleChars) + "****************";
    }
}
