package com.birthdaynotifier.dto;

import com.birthdaynotifier.entity.NotificationLog;

import java.time.LocalDateTime;
import java.util.UUID;

public class NotificationLogResponse {

    private UUID id;
    private String userName;
    private String recipientEmail;
    private String personName;
    private LocalDateTime scheduledFor;
    private LocalDateTime sentAt;
    private String status;
    private String errorMessage;

    public NotificationLogResponse() {
    }

    public static NotificationLogResponse fromEntity(NotificationLog log) {
        NotificationLogResponse dto = new NotificationLogResponse();
        dto.setId(log.getId());
        dto.setRecipientEmail(log.getRecipientEmail());
        dto.setPersonName(log.getPersonName());
        dto.setScheduledFor(log.getScheduledFor());
        dto.setSentAt(log.getSentAt());
        dto.setStatus(log.getStatus());
        dto.setErrorMessage(log.getErrorMessage());
        if (log.getUser() != null) {
            dto.setUserName(log.getUser().getFullName());
        }
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getPersonName() {
        return personName;
    }

    public void setPersonName(String personName) {
        this.personName = personName;
    }

    public LocalDateTime getScheduledFor() {
        return scheduledFor;
    }

    public void setScheduledFor(LocalDateTime scheduledFor) {
        this.scheduledFor = scheduledFor;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}

