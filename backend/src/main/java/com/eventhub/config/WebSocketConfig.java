package com.eventhub.config;

import java.util.Map;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.eventhub.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")
            .addInterceptors(new HandshakeInterceptor() {
                @Override
                public boolean beforeHandshake(@NonNull ServerHttpRequest request,
                                               @NonNull org.springframework.http.server.ServerHttpResponse response,
                                               @NonNull WebSocketHandler wsHandler,
                                               @NonNull Map<String, Object> attributes) {
                    if (request instanceof ServletServerHttpRequest servletRequest) {
                        String token = servletRequest.getServletRequest().getParameter("token");
                        if (token != null && !token.isBlank()) {
                            attributes.put("token", token);
                        }
                    }
                    return true;
                }

                @Override
                public void afterHandshake(@NonNull ServerHttpRequest request,
                                           @NonNull org.springframework.http.server.ServerHttpResponse response,
                                           @NonNull WebSocketHandler wsHandler,
                                           Exception exception) {
                    // no-op
                }
            })
            .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader == null) {
                        authHeader = accessor.getFirstNativeHeader("authorization");
                    }

                    String jwt = null;
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        jwt = authHeader.substring(7);
                    } else if (accessor.getSessionAttributes() != null) {
                        Object token = accessor.getSessionAttributes().get("token");
                        if (token instanceof String tokenValue && !tokenValue.isBlank()) {
                            jwt = tokenValue;
                        }
                    }

                    if (jwt != null) {
                        try {
                            String username = jwtUtil.extractUsername(jwt);
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            if (jwtUtil.validateToken(jwt, userDetails)) {
                                accessor.setUser(new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                                ));
                            }
                        } catch (Exception ignored) {
                            // Invalid token for WebSocket connect; leave unauthenticated.
                        }
                    }
                }
                return message;
            }
        });
    }
}
