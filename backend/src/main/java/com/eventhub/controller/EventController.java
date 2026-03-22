package com.eventhub.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eventhub.dto.EventDto;
import com.eventhub.entity.Event;
import com.eventhub.service.EventService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<List<EventDto.Response>> getAllEvents(Principal principal) {
        return ResponseEntity.ok(eventService.getAllEvents(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDto.Response> getEvent(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(eventService.getEvent(id, principal.getName()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventDto.Response> createEvent(
            @Valid @RequestBody EventDto.CreateRequest request) {
        return ResponseEntity.ok(eventService.createEvent(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventDto.Response> updateEvent(
            @PathVariable Long id,
            @RequestBody EventDto.UpdateRequest request) {
        return ResponseEntity.ok(eventService.updateEvent(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Map<String, String>> joinEvent(
            @PathVariable Long id, Principal principal) {
        String token = eventService.joinEvent(id, principal.getName());
        return ResponseEntity.ok(Map.of(
            "message", "Successfully registered for event",
            "accessToken", token
        ));
    }

    @PostMapping("/{id}/join-stream")
    public ResponseEntity<Void> recordJoin(@PathVariable Long id, Principal principal) {
        eventService.recordJoin(id, principal.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/leave-stream")
    public ResponseEntity<Void> recordLeave(@PathVariable Long id, Principal principal) {
        eventService.recordLeave(id, principal.getName());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        eventService.updateStatus(id, Event.EventStatus.valueOf(body.get("status")));
        return ResponseEntity.ok().build();
    }
}
