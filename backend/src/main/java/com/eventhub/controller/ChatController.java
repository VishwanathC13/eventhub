package com.eventhub.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import com.eventhub.dto.MessageDto;
import com.eventhub.service.ChatService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // WebSocket endpoint — messages sent to /app/chat are handled here
    @MessageMapping("/chat")
    public void handleWebSocketMessage(@Payload MessageDto.SendRequest request,
                                       Principal principal) {
        if (principal == null) {
            // Ignore unauthenticated WS sends; frontend uses REST fallback for reliability.
            return;
        }
        chatService.sendMessage(request, principal.getName());
    }

    // REST fallback — GET chat history
    @GetMapping("/events/{eventId}/messages")
    @ResponseBody
    public ResponseEntity<List<MessageDto.Response>> getHistory(@PathVariable Long eventId) {
        return ResponseEntity.ok(chatService.getHistory(eventId));
    }

    // REST fallback — send a message when WebSocket transport/auth fails
    @PostMapping("/events/{eventId}/messages")
    @ResponseBody
    public ResponseEntity<MessageDto.Response> sendMessage(
            @PathVariable Long eventId,
            @RequestBody MessageDto.SendRequest request,
            Principal principal) {
        if (principal == null) {
            throw new RuntimeException("Authentication required to send chat messages");
        }
        request.setEventId(eventId);
        return ResponseEntity.ok(chatService.sendMessage(request, principal.getName()));
    }
}
