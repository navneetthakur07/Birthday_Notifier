package com.birthdaynotifier.service;

import com.birthdaynotifier.entity.Birthday;
import com.birthdaynotifier.entity.NotificationLog;
import com.birthdaynotifier.entity.User;
import com.birthdaynotifier.repository.NotificationLogRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private NotificationLogRepository notificationLogRepository;

    @Value("${app.mail.from-email:birthday-notifier@noreply.com}")
    private String fromEmail;

    @Value("${app.mail.from-name:Birthday Reminder Bot}")
    private String fromName;

    public boolean sendBirthdayReminder(User user, Birthday birthday, boolean isManualTest) {
        String recipientEmail = user.getEmail();
        String personName = birthday.getPersonName();
        String relationship = birthday.getRelationship();
        Integer turningAge = birthday.calculateTurningAge(LocalDateTime.now().getYear() + (isManualTest ? 0 : 1));
        String notes = birthday.getNotes() != null && !birthday.getNotes().isBlank() ? birthday.getNotes() : "No special notes added.";

        String subject = isManualTest
                ? "🧪 [Test Reminder] Birthday Alert: " + personName + "'s Birthday!"
                : "🎂 Reminder: " + personName + "'s Birthday is Tomorrow!";

        String htmlContent = buildHtmlEmailContent(user.getFullName(), personName, relationship, turningAge, notes, isManualTest);

        NotificationLog log = new NotificationLog();
        log.setUser(user);
        log.setBirthday(birthday);
        log.setPersonName(personName);
        log.setRecipientEmail(recipientEmail);
        log.setScheduledFor(LocalDateTime.now());

        if (mailSender == null) {
            logger.warn("JavaMailSender not initialized or SMTP disabled. Simulating email delivery for: {}", recipientEmail);
            log.setStatus("SIMULATED");
            log.setSentAt(LocalDateTime.now());
            notificationLogRepository.save(log);
            return true;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Successfully dispatched reminder email to: {} for person: {}", recipientEmail, personName);

            log.setStatus("SUCCESS");
            log.setSentAt(LocalDateTime.now());
            notificationLogRepository.save(log);
            return true;
        } catch (Exception ex) {
            logger.error("Failed to deliver email to {}: {}", recipientEmail, ex.getMessage());
            log.setStatus("FAILED");
            log.setSentAt(LocalDateTime.now());
            log.setErrorMessage(ex.getMessage());
            notificationLogRepository.save(log);
            return false;
        }
    }

    private String buildHtmlEmailContent(String userName, String personName, String relationship, Integer turningAge, String notes, boolean isManualTest) {
        String ageText = turningAge != null ? "<p style=\"font-size: 16px; margin: 4px 0;\"><strong>Turning Age:</strong> " + turningAge + " years old 🎉</p>" : "";
        String badge = isManualTest
                ? "<div style=\"background-color: #fef3c7; color: #92400e; padding: 6px 12px; border-radius: 9999px; display: inline-block; font-size: 13px; font-weight: bold; margin-bottom: 12px;\">🧪 Manual Test Notification</div>"
                : "<div style=\"background-color: #ecfdf5; color: #065f46; padding: 6px 12px; border-radius: 9999px; display: inline-block; font-size: 13px; font-weight: bold; margin-bottom: 12px;\">⏰ 10-Minute Midnight Eve Alert (23:50)</div>";

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Birthday Reminder</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
                <table width="100%%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center">
                            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #6366f1 0%%, #a855f7 100%%); padding: 36px 32px; text-align: center; color: #ffffff;">
                                        <div style="font-size: 48px; margin-bottom: 8px;">🎂</div>
                                        <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Upcoming Birthday Alert!</h1>
                                        <p style="margin: 8px 0 0; font-size: 15px; opacity: 0.9;">Don't forget to send your warmest wishes at 00:00 midnight!</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 32px;">
                                        %s
                                        <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Hi %s,</h2>
                                        <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                                            This is your friendly reminder that your %s, <strong>%s</strong>, celebrates their birthday tomorrow!
                                        </p>

                                        <div style="background-color: #f1f5f9; border-left: 4px solid #6366f1; border-radius: 8px; padding: 16px; margin: 20px 0;">
                                            <p style="font-size: 16px; margin: 4px 0;"><strong>Name:</strong> %s</p>
                                            <p style="font-size: 16px; margin: 4px 0;"><strong>Relationship:</strong> %s</p>
                                            %s
                                            <p style="font-size: 14px; margin: 8px 0 4px; color: #64748b;"><strong>Notes &amp; Gift Ideas:</strong></p>
                                            <p style="font-size: 14px; margin: 0; color: #334155; font-style: italic;">"%s"</p>
                                        </div>

                                        <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                                            You've got 10 minutes before midnight strikes. Get your call, text, or surprise ready!
                                        </p>

                                        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
                                            Birthday Reminder Application &bull; Automatic 23:50 Eve Notification Service
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(badge, userName, relationship.toLowerCase(), personName, personName, relationship, ageText, notes);
    }
}
