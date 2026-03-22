package com.eventhub.service;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.eventhub.entity.Event;
import com.eventhub.entity.Registration;
import com.eventhub.repository.EventRepository;
import com.eventhub.repository.MessageRepository;
import com.eventhub.repository.RegistrationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AnalyticsService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final MessageRepository messageRepository;

    public Map<String, Object> getEventAnalytics(Long eventId) {
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("Event not found"));

        List<Registration> registrations = registrationRepository.findByEventId(eventId);
        int totalRegistered = registrations.size();
        int currentOnline = registrationRepository.countCurrentlyOnline(eventId);
        int totalMessages = messageRepository.countByEventId(eventId);

        double avgWatchMinutes = registrations.stream()
            .filter(r -> r.getJoinedAt() != null && r.getLeftAt() != null)
            .mapToLong(r -> Duration.between(r.getJoinedAt(), r.getLeftAt()).toMinutes())
            .average()
            .orElse(0);

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("eventId", eventId);
        analytics.put("eventTitle", event.getTitle());
        analytics.put("status", event.getStatus());
        analytics.put("totalRegistered", totalRegistered);
        analytics.put("maxCapacity", event.getMaxAttendees());
        analytics.put("currentOnline", currentOnline);
        analytics.put("totalMessages", totalMessages);
        analytics.put("avgWatchTimeMinutes", Math.round(avgWatchMinutes));
        analytics.put("fillRate", totalRegistered > 0
            ? Math.round((double) totalRegistered / event.getMaxAttendees() * 100) : 0);

        return analytics;
    }

    public Map<String, Object> getPlatformAnalytics() {
        long totalEvents = eventRepository.count();
        long liveEvents = eventRepository.findLiveEvents().size();
        long totalUsers = registrationRepository.count();
        long totalMessages = messageRepository.count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalEvents", totalEvents);
        summary.put("liveEvents", liveEvents);
        summary.put("totalRegistrations", totalUsers);
        summary.put("totalMessages", totalMessages);
        return summary;
    }
}
