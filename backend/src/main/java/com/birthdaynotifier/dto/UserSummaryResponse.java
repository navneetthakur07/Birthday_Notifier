package com.birthdaynotifier.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class UserSummaryResponse {
    private UUID id;
    private String email;
    private String fullName;
    private boolean active;
    private List<String> roles;
    private long totalBirthdays;
    private LocalDateTime createdAt;

    public UserSummaryResponse() {
    }

    public UserSummaryResponse(UUID id, String email, String fullName, boolean active, List<String> roles, long totalBirthdays, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.active = active;
        this.roles = roles;
        this.totalBirthdays = totalBirthdays;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public long getTotalBirthdays() {
        return totalBirthdays;
    }

    public void setTotalBirthdays(long totalBirthdays) {
        this.totalBirthdays = totalBirthdays;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

