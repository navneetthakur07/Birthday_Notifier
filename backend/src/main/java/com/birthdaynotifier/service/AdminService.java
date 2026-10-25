package com.birthdaynotifier.service;

import com.birthdaynotifier.dto.AppConfigDto;
import com.birthdaynotifier.dto.NotificationLogResponse;
import com.birthdaynotifier.dto.UserSummaryResponse;
import com.birthdaynotifier.entity.AppConfig;
import com.birthdaynotifier.entity.NotificationLog;
import com.birthdaynotifier.entity.Role;
import com.birthdaynotifier.entity.User;
import com.birthdaynotifier.repository.AppConfigRepository;
import com.birthdaynotifier.repository.BirthdayRepository;
import com.birthdaynotifier.repository.NotificationLogRepository;
import com.birthdaynotifier.repository.UserRepository;
import com.birthdaynotifier.scheduler.BirthdayReminderScheduler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final BirthdayRepository birthdayRepository;
    private final NotificationLogRepository notificationLogRepository;
    private final AppConfigRepository appConfigRepository;
    private final BirthdayReminderScheduler reminderScheduler;

    @Autowired
    public AdminService(UserRepository userRepository,
                        BirthdayRepository birthdayRepository,
                        NotificationLogRepository notificationLogRepository,
                        AppConfigRepository appConfigRepository,
                        BirthdayReminderScheduler reminderScheduler) {
        this.userRepository = userRepository;
        this.birthdayRepository = birthdayRepository;
        this.notificationLogRepository = notificationLogRepository;
        this.appConfigRepository = appConfigRepository;
        this.reminderScheduler = reminderScheduler;
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getAllUsers() {
        return userRepository.findAll().stream().map(user -> {
            long count = birthdayRepository.countByUserId(user.getId());
            List<String> roles = user.getRoles().stream()
                    .map(r -> r.getName().name())
                    .collect(Collectors.toList());
            return new UserSummaryResponse(
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.isActive(),
                    roles,
                    count,
                    user.getCreatedAt()
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public boolean toggleUserStatus(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setActive(!user.isActive());
        userRepository.save(user);
        return user.isActive();
    }

    @Transactional(readOnly = true)
    public List<NotificationLogResponse> getRecentLogs(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<NotificationLog> page = notificationLogRepository.findAllByOrderByScheduledForDesc(pageable);
        return page.getContent().stream()
                .map(NotificationLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSystemStatistics() {
        Map<String, Object> stats = new HashMap<>();
        long totalUsers = userRepository.count();
        long totalBirthdays = birthdayRepository.count();
        long totalNotifications = notificationLogRepository.count();
        long successfulNotifications = notificationLogRepository.countByStatus("SUCCESS");
        long failedNotifications = notificationLogRepository.countByStatus("FAILED");

        stats.put("totalUsers", totalUsers);
        stats.put("totalBirthdays", totalBirthdays);
        stats.put("totalNotifications", totalNotifications);
        stats.put("successfulNotifications", successfulNotifications);
        stats.put("failedNotifications", failedNotifications);
        return stats;
    }

    @Transactional(readOnly = true)
    public List<AppConfigDto> getAllConfigs() {
        return appConfigRepository.findAll().stream()
                .map(c -> new AppConfigDto(c.getConfigKey(), c.getConfigValue(), c.getDescription()))
                .collect(Collectors.toList());
    }

    @Transactional
    public AppConfigDto updateConfig(String key, String value) {
        AppConfig config = appConfigRepository.findByConfigKey(key)
                .orElse(new AppConfig(key, value, "Configuration property for " + key));
        config.setConfigValue(value);
        AppConfig saved = appConfigRepository.save(config);
        return new AppConfigDto(saved.getConfigKey(), saved.getConfigValue(), saved.getDescription());
    }

    public int triggerManualReminder(LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now().plusDays(1);
        return reminderScheduler.processRemindersForTargetDate(target);
    }
}
