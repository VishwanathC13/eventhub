package com.eventhub.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.eventhub.entity.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByEventIdOrderBySentAtAsc(Long eventId);
    int countByEventId(Long eventId);
    void deleteByEventId(Long eventId);
}
