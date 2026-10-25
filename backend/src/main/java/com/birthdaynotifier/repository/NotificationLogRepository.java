package com.birthdaynotifier.repository;

import com.birthdaynotifier.entity.NotificationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, UUID> {
    List<NotificationLog> findTop20ByUserIdOrderByScheduledForDesc(UUID userId);
    Page<NotificationLog> findAllByOrderByScheduledForDesc(Pageable pageable);
    long countByStatus(String status);
}
