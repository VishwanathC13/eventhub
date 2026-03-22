package com.eventhub.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.eventhub.dto.MessageDto;
import com.eventhub.entity.Event;
import com.eventhub.entity.Message;
import com.eventhub.entity.User;
import com.eventhub.repository.EventRepository;
import com.eventhub.repository.MessageRepository;
import com.eventhub.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ChatService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageDto.Response sendMessage(MessageDto.SendRequest request, String senderEmail) {
        User sender = userRepository.findByEmail(senderEmail).orElseThrow();
        Event event = eventRepository.findById(request.getEventId())
            .orElseThrow(() -> new RuntimeException("Event not found"));

        Message message = Message.builder()
            .content(request.getContent())
            .sender(sender)
            .event(event)
            .type(request.getType())
            .build();

        messageRepository.save(message);
        MessageDto.Response response = MessageDto.Response.from(message);

        // Broadcast to all subscribers of this event's chat topic
        messagingTemplate.convertAndSend(
            "/topic/chat/" + request.getEventId(), response);

        return response;
    }

    public List<MessageDto.Response> getHistory(Long eventId) {
        return messageRepository.findByEventIdOrderBySentAtAsc(eventId).stream()
            .map(MessageDto.Response::from)
            .collect(Collectors.toList());
    }
}
