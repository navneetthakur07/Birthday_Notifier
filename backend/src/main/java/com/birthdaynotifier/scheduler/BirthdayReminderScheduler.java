package com.birthdaynotifier.scheduler;

import com.birthdaynotifier.entity.Birthday;
import com.birthdaynotifier.repository.BirthdayRepository;
import com.birthdaynotifier.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class BirthdayReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(BirthdayReminderScheduler.class);

    private final BirthdayRepository birthdayRepository;
    private final EmailService emailService;

    @Autowired
    public BirthdayReminderScheduler(BirthdayRepository birthdayRepository, EmailService emailService) {
        this.birthdayRepository = birthdayRepository;
        this.emailService = emailService;
    }

    /**
     * Executes everyday at 23:50 (11:50 PM) server time.
     * Looks up birthdays for tomorrow (plus 1 day) and sends reminder emails.
     */
    @Scheduled(cron = "${app.reminder.cron:0 50 23 * * ?}")
    public void runMidnightEveReminderJob() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        logger.info("Executing Midnight Eve (23:50) Birthday Reminder Cron Job for date: {}", tomorrow);
        int count = processRemindersForTargetDate(tomorrow);
        logger.info("Midnight Eve Birthday Reminder Job finished. Total reminders processed: {}", count);
    }

    /**
     * Process reminders for a specific target date (used by scheduled job and admin manual trigger).
     */
    public int processRemindersForTargetDate(LocalDate targetDate) {
        int month = targetDate.getMonthValue();
        int day = targetDate.getDayOfMonth();

        List<Birthday> dueBirthdays = birthdayRepository.findActiveBirthdaysForDate(month, day);
        logger.info("Found {} active birthday reminders due for date: {}/{}", dueBirthdays.size(), day, month);

        int successCount = 0;
        for (Birthday birthday : dueBirthdays) {
            try {
                boolean delivered = emailService.sendBirthdayReminder(birthday.getUser(), birthday, false);
                if (delivered) {
                    successCount++;
                }
            } catch (Exception ex) {
                logger.error("Error processing reminder for birthday ID {}: {}", birthday.getId(), ex.getMessage());
            }
        }
        return successCount;
    }
}
