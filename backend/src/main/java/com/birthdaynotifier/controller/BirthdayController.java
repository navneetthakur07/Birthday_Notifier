package com.birthdaynotifier.controller;

import com.birthdaynotifier.dto.BirthdayRequest;
import com.birthdaynotifier.dto.BirthdayResponse;
import com.birthdaynotifier.dto.MessageResponse;
import com.birthdaynotifier.security.UserDetailsImpl;
import com.birthdaynotifier.service.BirthdayService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/birthdays")
public class BirthdayController {

    private final BirthdayService birthdayService;

    @Autowired
    public BirthdayController(BirthdayService birthdayService) {
        this.birthdayService = birthdayService;
    }

    @GetMapping
    public ResponseEntity<List<BirthdayResponse>> getMyBirthdays(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        List<BirthdayResponse> birthdays = birthdayService.getUserBirthdays(currentUser.getId());
        return ResponseEntity.ok(birthdays);
    }

    @PostMapping
    public ResponseEntity<BirthdayResponse> addBirthday(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody BirthdayRequest request) {
        BirthdayResponse created = birthdayService.createBirthday(currentUser.getId(), request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BirthdayResponse> updateBirthday(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID id,
            @Valid @RequestBody BirthdayRequest request) {
        BirthdayResponse updated = birthdayService.updateBirthday(currentUser.getId(), id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteBirthday(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID id) {
        birthdayService.deleteBirthday(currentUser.getId(), id);
        return ResponseEntity.ok(new MessageResponse("Birthday deleted successfully", true));
    }

    @PostMapping("/{id}/test-reminder")
    public ResponseEntity<MessageResponse> sendTestReminder(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID id) {
        boolean sent = birthdayService.triggerTestReminder(currentUser.getId(), id);
        if (sent) {
            return ResponseEntity.ok(new MessageResponse("Test reminder notification dispatched successfully!", true));
        } else {
            return ResponseEntity.ok(new MessageResponse("Test reminder simulation completed (SMTP credentials pending).", true));
        }
    }
}

