package com.eventhub.dto;

import com.eventhub.entity.Message;
import lombok.Data;
import java.time.LocalDateTime;

public class MessageDto {

    @Data
    public static class SendRequest {
        private String content;
        private Long eventId;
        private Message.MessageType type = Message.MessageType.CHAT;
    }

    @Data
    public static class Response {
        private Long id;
        private String content;
        private String senderName;
        private String senderEmail;
        private Long eventId;
        private Message.MessageType type;
        private LocalDateTime sentAt;

        public static Response from(Message message) {
            Response r = new Response();
            r.id = message.getId();
            r.content = message.getContent();
            r.senderName = message.getSender().getFirstName() + " " + message.getSender().getLastName();
            r.senderEmail = message.getSender().getEmail();
            r.eventId = message.getEvent().getId();
            r.type = message.getType();
            r.sentAt = message.getSentAt();
            return r;
        }
    }
}
