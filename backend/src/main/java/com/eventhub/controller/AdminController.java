package com.eventhub.controller;

import com.eventhub.entity.User;
import com.eventhub.repository.RegistrationRepository;
import com.eventhub.repository.UserRepository;
import com.eventhub.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class AdminController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;

    @GetMapping("/admin/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getPlatformAnalytics() {
        return ResponseEntity.ok(analyticsService.getPlatformAnalytics());
    }

    @GetMapping("/admin/analytics/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getEventAnalytics(@PathVariable Long eventId) {
        return ResponseEntity.ok(analyticsService.getEventAnalytics(eventId));
    }

    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream()
            .map(u -> Map.<String, Object>of(
                "id", u.getId(),
                "email", u.getEmail(),
                "name", u.getFirstName() + " " + u.getLastName(),
                "company", u.getCompany() != null ? u.getCompany() : "",
                "role", u.getRole().name(),
                "createdAt", u.getCreatedAt().toString()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/admin/events/{eventId}/attendees")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getEventAttendees(@PathVariable Long eventId) {
        List<Map<String, Object>> attendees = registrationRepository.findByEventId(eventId).stream()
            .map(r -> {
                User u = r.getUser();
                return Map.<String, Object>of(
                    "userId", u.getId(),
                    "name", u.getFirstName() + " " + u.getLastName(),
                    "email", u.getEmail(),
                    "company", u.getCompany() != null ? u.getCompany() : "",
                    "registeredAt", r.getRegisteredAt().toString(),
                    "online", r.getJoinedAt() != null && r.getLeftAt() == null
                );
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(attendees);
    }
}
