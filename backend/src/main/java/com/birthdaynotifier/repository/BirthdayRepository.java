package com.birthdaynotifier.repository;

import com.birthdaynotifier.entity.Birthday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BirthdayRepository extends JpaRepository<Birthday, UUID> {

    List<Birthday> findByUserIdOrderByBirthMonthAscBirthDayAsc(UUID userId);

    Optional<Birthday> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT b FROM Birthday b JOIN FETCH b.user u " +
           "WHERE b.reminderEnabled = true " +
           "AND u.active = true " +
           "AND b.birthMonth = :month " +
           "AND b.birthDay = :day")
    List<Birthday> findActiveBirthdaysForDate(@Param("month") int month, @Param("day") int day);

    long countByUserId(UUID userId);
}

