package com.birthdaynotifier.dto;

import com.birthdaynotifier.entity.Birthday;

import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

public class BirthdayResponse {

    private UUID id;
    private String personName;
    private String relationship;
    private int birthMonth;
    private int birthDay;
    private Integer birthYear;
    private String contactEmail;
    private String phoneNumber;
    private String notes;
    private boolean reminderEnabled;
    private Integer turningAge;
    private long daysUntil;
    private String formattedBirthday;
    private boolean isToday;
    private boolean isTomorrow;

    public BirthdayResponse() {
    }

    public static BirthdayResponse fromEntity(Birthday birthday) {
        BirthdayResponse dto = new BirthdayResponse();
        dto.setId(birthday.getId());
        dto.setPersonName(birthday.getPersonName());
        dto.setRelationship(birthday.getRelationship());
        dto.setBirthMonth(birthday.getBirthMonth());
        dto.setBirthDay(birthday.getBirthDay());
        dto.setBirthYear(birthday.getBirthYear());
        dto.setContactEmail(birthday.getContactEmail());
        dto.setPhoneNumber(birthday.getPhoneNumber());
        dto.setNotes(birthday.getNotes());
        dto.setReminderEnabled(birthday.isReminderEnabled());

        LocalDate now = LocalDate.now();
        int currentYear = now.getYear();

        LocalDate nextBirthdayDate;
        try {
            nextBirthdayDate = LocalDate.of(currentYear, birthday.getBirthMonth(), birthday.getBirthDay());
        } catch (Exception e) {
            // Handle leap year Feb 29 on non-leap years
            nextBirthdayDate = LocalDate.of(currentYear, birthday.getBirthMonth(), 28);
        }

        if (nextBirthdayDate.isBefore(now)) {
            try {
                nextBirthdayDate = LocalDate.of(currentYear + 1, birthday.getBirthMonth(), birthday.getBirthDay());
            } catch (Exception e) {
                nextBirthdayDate = LocalDate.of(currentYear + 1, birthday.getBirthMonth(), 28);
            }
        }

        long days = ChronoUnit.DAYS.between(now, nextBirthdayDate);
        dto.setDaysUntil(days);
        dto.setToday(days == 0);
        dto.setTomorrow(days == 1);

        if (birthday.getBirthYear() != null && birthday.getBirthYear() > 0) {
            dto.setTurningAge(nextBirthdayDate.getYear() - birthday.getBirthYear());
        }

        String monthName = Month.of(birthday.getBirthMonth()).getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        dto.setFormattedBirthday(birthday.getBirthDay() + " " + monthName +
                (birthday.getBirthYear() != null ? ", " + birthday.getBirthYear() : ""));

        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getPersonName() {
        return personName;
    }

    public void setPersonName(String personName) {
        this.personName = personName;
    }

    public String getRelationship() {
        return relationship;
    }

    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }

    public int getBirthMonth() {
        return birthMonth;
    }

    public void setBirthMonth(int birthMonth) {
        this.birthMonth = birthMonth;
    }

    public int getBirthDay() {
        return birthDay;
    }

    public void setBirthDay(int birthDay) {
        this.birthDay = birthDay;
    }

    public Integer getBirthYear() {
        return birthYear;
    }

    public void setBirthYear(Integer birthYear) {
        this.birthYear = birthYear;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public boolean isReminderEnabled() {
        return reminderEnabled;
    }

    public void setReminderEnabled(boolean reminderEnabled) {
        this.reminderEnabled = reminderEnabled;
    }

    public Integer getTurningAge() {
        return turningAge;
    }

    public void setTurningAge(Integer turningAge) {
        this.turningAge = turningAge;
    }

    public long getDaysUntil() {
        return daysUntil;
    }

    public void setDaysUntil(long daysUntil) {
        this.daysUntil = daysUntil;
    }

    public String getFormattedBirthday() {
        return formattedBirthday;
    }

    public void setFormattedBirthday(String formattedBirthday) {
        this.formattedBirthday = formattedBirthday;
    }

    public boolean isToday() {
        return isToday;
    }

    public void setToday(boolean today) {
        isToday = today;
    }

    public boolean isTomorrow() {
        return isTomorrow;
    }

    public void setTomorrow(boolean tomorrow) {
        isTomorrow = tomorrow;
    }
}

