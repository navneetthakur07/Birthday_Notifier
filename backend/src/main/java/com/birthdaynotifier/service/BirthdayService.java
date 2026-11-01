package com.birthdaynotifier.service;

import com.birthdaynotifier.dto.BirthdayRequest;
import com.birthdaynotifier.dto.BirthdayResponse;
import com.birthdaynotifier.entity.Birthday;
import com.birthdaynotifier.entity.User;
import com.birthdaynotifier.repository.BirthdayRepository;
import com.birthdaynotifier.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BirthdayService {

    private final BirthdayRepository birthdayRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Autowired
    public BirthdayService(BirthdayRepository birthdayRepository, UserRepository userRepository, EmailService emailService) {
        this.birthdayRepository = birthdayRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public List<BirthdayResponse> getUserBirthdays(UUID userId) {
        return birthdayRepository.findByUserIdOrderByBirthMonthAscBirthDayAsc(userId)
                .stream()
                .map(BirthdayResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public BirthdayResponse createBirthday(UUID userId, BirthdayRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Birthday birthday = new Birthday();
        birthday.setUser(user);
        mapRequestToEntity(request, birthday);

        Birthday saved = birthdayRepository.save(birthday);
        return BirthdayResponse.fromEntity(saved);
    }

    @Transactional
    public BirthdayResponse updateBirthday(UUID userId, UUID birthdayId, BirthdayRequest request) {
        Birthday birthday = birthdayRepository.findByIdAndUserId(birthdayId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Birthday entry not found or unauthorized"));

        mapRequestToEntity(request, birthday);
        Birthday updated = birthdayRepository.save(birthday);
        return BirthdayResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteBirthday(UUID userId, UUID birthdayId) {
        Birthday birthday = birthdayRepository.findByIdAndUserId(birthdayId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Birthday entry not found or unauthorized"));
        birthdayRepository.delete(birthday);
    }

    @Transactional
    public boolean triggerTestReminder(UUID userId, UUID birthdayId) {
        Birthday birthday = birthdayRepository.findByIdAndUserId(birthdayId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Birthday entry not found or unauthorized"));
        User user = birthday.getUser();
        return emailService.sendBirthdayReminder(user, birthday, true);
    }

    private void mapRequestToEntity(BirthdayRequest req, Birthday target) {
        target.setPersonName(req.getPersonName());
        target.setRelationship(req.getRelationship() != null ? req.getRelationship() : "FRIEND");
        target.setBirthMonth(req.getBirthMonth());
        target.setBirthDay(req.getBirthDay());
        target.setBirthYear(req.getBirthYear());
        target.setContactEmail(req.getContactEmail());
        target.setPhoneNumber(req.getPhoneNumber());
        target.setNotes(req.getNotes());
        target.setReminderEnabled(req.isReminderEnabled());
    }
}

