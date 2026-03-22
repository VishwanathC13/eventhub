package com.eventhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Column(nullable = false)
    @Builder.Default
    private int maxAttendees = 350;

    private String streamUrl;
    private String slidoUrl;
    private String streamId;
    private String roomId;
    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    private EventStatus status;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    private Set<Registration> registrations;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    private Set<Message> messages;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "analytics_id")
    private Analytics analytics;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = EventStatus.UPCOMING;
    }

    public enum EventStatus {
        UPCOMING, LIVE, ENDED, CANCELLED
    }
}
