package com.eventhub.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eventhub.dto.EventDto;
import com.eventhub.entity.Event;
import com.eventhub.entity.Registration;
import com.eventhub.entity.User;
import com.eventhub.repository.EventRepository;
import com.eventhub.repository.MessageRepository;
import com.eventhub.repository.RegistrationRepository;
import com.eventhub.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class EventService {

    private final EventRepository eventRepository;
    private final MessageRepository messageRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;

    @Value("${event.max-attendees}")
    private int maxAttendees;

    public List<EventDto.Response> getAllEvents(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        return eventRepository.findAllByOrderByStartTimeAsc().stream()
            .map(e -> {
                int count = registrationRepository.countByEventId(e.getId());
                boolean registered = registrationRepository.existsByUserIdAndEventId(user.getId(), e.getId());
                return EventDto.Response.from(e, count, registered);
            })
            .collect(Collectors.toList());
    }

    public EventDto.Response getEvent(Long id, String userEmail) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found"));
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        int count = registrationRepository.countByEventId(id);
        boolean registered = registrationRepository.existsByUserIdAndEventId(user.getId(), id);
        return EventDto.Response.from(event, count, registered);
    }

    public EventDto.Response createEvent(EventDto.CreateRequest request) {
        Event event = Event.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .maxAttendees(request.getMaxAttendees() > 0 ? request.getMaxAttendees() : maxAttendees)
            .streamUrl(request.getStreamUrl())
            .slidoUrl(request.getSlidoUrl())
            .streamId(UUID.randomUUID().toString())
            .roomId(UUID.randomUUID().toString())
            .thumbnailUrl(request.getThumbnailUrl())
            .status(Event.EventStatus.UPCOMING)
            .build();

        eventRepository.save(event);
        return EventDto.Response.from(event, 0, false);
    }

    @Transactional
    public EventDto.Response updateEvent(Long eventId, EventDto.UpdateRequest request) {
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("Event not found"));

        if (request.getTitle() != null) event.setTitle(request.getTitle());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getStartTime() != null) event.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) event.setEndTime(request.getEndTime());
        if (request.getMaxAttendees() != null && request.getMaxAttendees() > 0) {
            event.setMaxAttendees(request.getMaxAttendees());
        }
        if (request.getStreamUrl() != null) event.setStreamUrl(request.getStreamUrl());
        if (request.getSlidoUrl() != null) event.setSlidoUrl(request.getSlidoUrl());
        if (request.getThumbnailUrl() != null) event.setThumbnailUrl(request.getThumbnailUrl());

        eventRepository.save(event);
        int count = registrationRepository.countByEventId(eventId);
        return EventDto.Response.from(event, count, false);
    }

    @Transactional
    public void deleteEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("Event not found"));

        // Remove dependent rows explicitly to avoid FK constraint failures.
        messageRepository.deleteByEventId(eventId);
        registrationRepository.deleteByEventId(eventId);

        eventRepository.delete(event);
    }

    @Transactional
    public String joinEvent(Long eventId, String userEmail) {
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("Event not found"));
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        if (registrationRepository.existsByUserIdAndEventId(user.getId(), eventId)) {
            throw new RuntimeException("Already registered for this event");
        }

        int current = registrationRepository.countByEventId(eventId);
        if (current >= event.getMaxAttendees()) {
            throw new RuntimeException("Event is at full capacity (" + event.getMaxAttendees() + ")");
        }

        String accessToken = UUID.randomUUID().toString();
        Registration registration = Registration.builder()
            .user(user)
            .event(event)
            .accessToken(accessToken)
            .build();

        registrationRepository.save(registration);
        return accessToken;
    }

    @Transactional
    public void updateStatus(Long eventId, Event.EventStatus status) {
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("Event not found"));
        event.setStatus(status);
        eventRepository.save(event);
    }

    @Transactional
    public void recordJoin(Long eventId, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        registrationRepository.findByUserIdAndEventId(user.getId(), eventId)
            .ifPresent(reg -> {
                reg.setJoinedAt(LocalDateTime.now());
                registrationRepository.save(reg);
            });
    }

    @Transactional
    public void recordLeave(Long eventId, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        registrationRepository.findByUserIdAndEventId(user.getId(), eventId)
            .ifPresent(reg -> {
                reg.setLeftAt(LocalDateTime.now());
                registrationRepository.save(reg);
            });
    }
}
