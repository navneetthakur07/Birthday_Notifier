package com.birthdaynotifier.dto;

public class OAuth2ConfigDto {
    private String clientId;
    private String clientSecret;
    private String refreshToken;
    private String connectedEmail;
    private boolean connected;
    private String provider;
    private String authUrl;

    public OAuth2ConfigDto() {
    }

    public OAuth2ConfigDto(String clientId, String clientSecret, String refreshToken, String connectedEmail, boolean connected, String provider) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
        this.connectedEmail = connectedEmail;
        this.connected = connected;
        this.provider = provider;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getConnectedEmail() {
        return connectedEmail;
    }

    public void setConnectedEmail(String connectedEmail) {
        this.connectedEmail = connectedEmail;
    }

    public boolean isConnected() {
        return connected;
    }

    public void setConnected(boolean connected) {
        this.connected = connected;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getAuthUrl() {
        return authUrl;
    }

    public void setAuthUrl(String authUrl) {
        this.authUrl = authUrl;
    }
}
