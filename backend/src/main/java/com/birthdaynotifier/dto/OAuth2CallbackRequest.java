package com.birthdaynotifier.dto;

import jakarta.validation.constraints.NotBlank;

public class OAuth2CallbackRequest {

    @NotBlank
    private String code;

    private String redirectUri;

    public OAuth2CallbackRequest() {
    }

    public OAuth2CallbackRequest(String code, String redirectUri) {
        this.code = code;
        this.redirectUri = redirectUri;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }
}
