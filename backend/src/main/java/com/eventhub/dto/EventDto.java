package com.eventhub.dto;

import java.time.LocalDateTime;

import com.eventhub.entity.Event;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

public class EventDto {

    @Data
    public static class CreateRequest {
        @NotBlank
        private String title;

        private String description;

        @NotNull @Future
        private LocalDateTime startTime;

        private LocalDateTime endTime;

        private int maxAttendees = 350;
        private String streamUrl;
        private String slidoUrl;
        private String thumbnailUrl;
    }

    @Data
    public static class UpdateRequest {
        private String title;
        private String description;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Integer maxAttendees;
        private String streamUrl;
        private String slidoUrl;
        private String thumbnailUrl;
    }

    @Data
    public static class Response {
        private Long id;
        private String title;
        private String description;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private int maxAttendees;
        private int currentAttendees;
        private String streamUrl;
        private String slidoUrl;
        private String streamId;
        private String thumbnailUrl;
        private Event.EventStatus status;
        private LocalDateTime createdAt;
        private boolean isRegistered;

        public static Response from(Event event, int currentAttendees, boolean isRegistered) {
            Response r = new Response();
            r.id = event.getId();
            r.title = event.getTitle();
            r.description = event.getDescription();
            r.startTime = event.getStartTime();
            r.endTime = event.getEndTime();
            r.maxAttendees = event.getMaxAttendees();
            r.currentAttendees = currentAttendees;
            r.streamUrl = event.getStreamUrl();
            r.slidoUrl = event.getSlidoUrl();
            r.streamId = event.getStreamId();
            r.thumbnailUrl = event.getThumbnailUrl();
            r.status = event.getStatus();
            r.createdAt = event.getCreatedAt();
            r.isRegistered = isRegistered;
            return r;
        }
    }
}
