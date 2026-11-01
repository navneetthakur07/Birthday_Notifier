package com.birthdaynotifier.config;

import com.birthdaynotifier.entity.*;
import com.birthdaynotifier.repository.AppConfigRepository;
import com.birthdaynotifier.repository.BirthdayRepository;
import com.birthdaynotifier.repository.RoleRepository;
import com.birthdaynotifier.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Set;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final BirthdayRepository birthdayRepository;
    private final AppConfigRepository appConfigRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           BirthdayRepository birthdayRepository,
                           AppConfigRepository appConfigRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.birthdayRepository = birthdayRepository;
        this.appConfigRepository = appConfigRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // 1. Seed Roles
        Role roleUser = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_USER)));

        Role roleAdmin = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_ADMIN)));

        // 2. Seed Default Admin
        if (!userRepository.existsByEmail("admin@birthday.com")) {
            User admin = new User("admin@birthday.com", passwordEncoder.encode("Admin@123"), "System Administrator");
            admin.setRoles(Set.of(roleUser, roleAdmin));
            userRepository.save(admin);
            logger.info("Default Admin account seeded: admin@birthday.com / Admin@123");
        }

        // 3. Seed Default Demo User with sample birthday entries (including one tomorrow for testing!)
        if (!userRepository.existsByEmail("user@birthday.com")) {
            User demoUser = new User("user@birthday.com", passwordEncoder.encode("User@123"), "Alex Johnson");
            demoUser.setRoles(Set.of(roleUser));
            User savedDemoUser = userRepository.save(demoUser);
            logger.info("Demo User account seeded: user@birthday.com / User@123");

            LocalDate tomorrow = LocalDate.now().plusDays(1);
            LocalDate nextWeek = LocalDate.now().plusDays(7);

            // Tomorrow's birthday (perfect for immediate testing of 23:50 alert)
            Birthday b1 = new Birthday();
            b1.setUser(savedDemoUser);
            b1.setPersonName("Sophia Miller");
            b1.setRelationship("FAMILY");
            b1.setBirthMonth(tomorrow.getMonthValue());
            b1.setBirthDay(tomorrow.getDayOfMonth());
            b1.setBirthYear(1998);
            b1.setContactEmail("sophia.miller@example.com");
            b1.setPhoneNumber("+1-555-0199");
            b1.setNotes("Loves matcha tea and sci-fi books. Call her right at 00:00 midnight!");
            b1.setReminderEnabled(true);
            birthdayRepository.save(b1);

            // Next week birthday
            Birthday b2 = new Birthday();
            b2.setUser(savedDemoUser);
            b2.setPersonName("Liam Davis");
            b2.setRelationship("FRIEND");
            b2.setBirthMonth(nextWeek.getMonthValue());
            b2.setBirthDay(nextWeek.getDayOfMonth());
            b2.setBirthYear(1995);
            b2.setContactEmail("liam.davis@example.com");
            b2.setNotes("Enjoys board games and hiking.");
            b2.setReminderEnabled(true);
            birthdayRepository.save(b2);
        }

        // 4. Seed App Configurations
        seedConfigIfAbsent("REMINDER_CRON", "0 50 23 * * ?", "Cron expression for the Midnight-Eve birthday reminder job");
        seedConfigIfAbsent("NOTIFICATION_WINDOW_MINS", "10", "Minutes before midnight to trigger reminder (default: 10 mins at 23:50)");
        seedConfigIfAbsent("SENDER_NAME", "Birthday Reminder Bot", "Display name shown in the recipient inbox");
        seedConfigIfAbsent("EMAIL_SUBJECT_TEMPLATE", "🎂 Reminder: {friend_name}'s Birthday is Tomorrow!", "Default subject line for birthday notifications");
        seedConfigIfAbsent("EMAIL_PROVIDER", "GOOGLE_OAUTH2", "Primary notification engine: GOOGLE_OAUTH2 (modern REST) with optional SMTP fallback");
        seedConfigIfAbsent("GOOGLE_OAUTH_CONNECTED_EMAIL", "", "Google account email authorized for dispatching reminders");
    }

    private void seedConfigIfAbsent(String key, String value, String desc) {
        if (appConfigRepository.findByConfigKey(key).isEmpty()) {
            appConfigRepository.save(new AppConfig(key, value, desc));
        }
    }
}
