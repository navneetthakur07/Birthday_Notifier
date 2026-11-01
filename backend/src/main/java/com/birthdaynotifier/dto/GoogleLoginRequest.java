package com.birthdaynotifier.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String fullName;

    private String googleId;

    public GoogleLoginRequest() {
    }

    public GoogleLoginRequest(String email, String fullName, String googleId) {
        this.email = email;
        this.fullName = fullName;
        this.googleId = googleId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getGoogleId() {
        return googleId;
    }

    public void setGoogleId(String googleId) {
        this.googleId = googleId;
    }
}
