package com.eventhub.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.eventhub.entity.Registration;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    boolean existsByUserIdAndEventId(Long userId, Long eventId);
    int countByEventId(Long eventId);
    List<Registration> findByEventId(Long eventId);
    Optional<Registration> findByUserIdAndEventId(Long userId, Long eventId);
    void deleteByEventId(Long eventId);

    @Query("SELECT COUNT(r) FROM Registration r WHERE r.event.id = ?1 AND r.leftAt IS NULL AND r.joinedAt IS NOT NULL")
    int countCurrentlyOnline(Long eventId);
}
