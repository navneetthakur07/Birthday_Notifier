package com.birthdaynotifier.controller;

import com.birthdaynotifier.dto.AppConfigDto;
import com.birthdaynotifier.dto.MessageResponse;
import com.birthdaynotifier.dto.NotificationLogResponse;
import com.birthdaynotifier.dto.UserSummaryResponse;
import com.birthdaynotifier.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @Autowired
    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/users/{id}/toggle-status")
    public ResponseEntity<MessageResponse> toggleUserStatus(@PathVariable UUID id) {
        boolean active = adminService.toggleUserStatus(id);
        return ResponseEntity.ok(new MessageResponse("User is now " + (active ? "ACTIVE" : "INACTIVE"), true));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<NotificationLogResponse>> getNotificationLogs(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(adminService.getRecentLogs(limit));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        return ResponseEntity.ok(adminService.getSystemStatistics());
    }

    @GetMapping("/configs")
    public ResponseEntity<List<AppConfigDto>> getConfigs() {
        return ResponseEntity.ok(adminService.getAllConfigs());
    }

    @PutMapping("/configs")
    public ResponseEntity<AppConfigDto> updateConfig(@RequestBody AppConfigDto dto) {
        AppConfigDto updated = adminService.updateConfig(dto.getConfigKey(), dto.getConfigValue());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/trigger-scheduler")
    public ResponseEntity<MessageResponse> triggerSchedulerManually(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate) {
        LocalDate date = targetDate != null ? targetDate : LocalDate.now().plusDays(1);
        int count = adminService.triggerManualReminder(date);
        return ResponseEntity.ok(new MessageResponse("Midnight Eve Reminder executed for " + date + ". " + count + " reminders dispatched.", true));
    }
}
