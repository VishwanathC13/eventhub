# EventHub — Virtual Event Platform

Full-stack virtual event platform built with **Spring Boot** (backend) + **React + Vite** (frontend).

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Spring Boot 3.2, Spring Security, Spring Data JPA, WebSocket (STOMP) |
| Auth | JWT (jjwt), BCrypt |
| Database | MySQL |
| Frontend | React 18, Vite, React Router v6 |
| Realtime | WebSocket via SockJS + STOMP |
| Styling | Custom CSS design system (no UI library) |

---

## Quick Start

### 1. Database
```sql
CREATE DATABASE eventhub_db;
```

### 2. Backend
```bash
cd backend

# Edit src/main/resources/application.properties
# Set your MySQL username & password

mvn spring-boot:run
# Runs on http://localhost:8080
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## API Reference

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login, returns JWT |

### Events
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/events` | Auth | List all events |
| GET | `/events/{id}` | Auth | Get event details |
| POST | `/events` | Admin | Create event |
| POST | `/events/{id}/join` | Auth | Register for event |
| POST | `/events/{id}/join-stream` | Auth | Record stream join |
| POST | `/events/{id}/leave-stream` | Auth | Record stream leave |
| PUT | `/events/{id}/status` | Admin | Update event status |

### Chat
| Method | Endpoint | Access | Description |
|---|---|---|---|
| WS | `/ws` (STOMP) | Auth | WebSocket connection |
| WS send | `/app/chat` | Auth | Send chat message |
| WS subscribe | `/topic/chat/{eventId}` | Auth | Receive messages |
| GET | `/events/{eventId}/messages` | Auth | Chat history |

### Admin
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/admin/analytics` | Admin | Platform-wide analytics |
| GET | `/admin/analytics/{eventId}` | Admin | Per-event analytics |
| GET | `/admin/users` | Admin | All users |
| GET | `/admin/events/{eventId}/attendees` | Admin | Event attendees |

---

## Project Structure

```
eventhub/
├── backend/
│   └── src/main/java/com/eventhub/
│       ├── controller/      AuthController, EventController, ChatController, AdminController
│       ├── service/         AuthService, EventService, ChatService, AnalyticsService
│       ├── repository/      UserRepository, EventRepository, RegistrationRepository, MessageRepository
│       ├── entity/          User, Event, Registration, Message, Analytics
│       ├── dto/             AuthDto, EventDto, MessageDto
│       ├── security/        JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
│       └── config/          SecurityConfig, WebSocketConfig
│
└── frontend/
    └── src/
        ├── pages/           Login, Register, EventList, EventLive, AdminDashboard
        ├── components/      Navbar, EventCard, ChatPanel
        ├── context/         AuthContext
        ├── services/        api.js (axios)
        └── App.jsx          Routes + protected route wrapper
```

---

## Create First Admin User

After running the app, register normally via `/register`, then manually update the role in MySQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

---

## Deployment

| Service | Deploy to |
|---|---|
| Backend | Render / Railway / AWS EC2 |
| Database | Railway MySQL / PlanetScale / AWS RDS |
| Frontend | Vercel (`npm run build` → deploy `dist/`) |

For production, update `application.properties`:
- Change `spring.jpa.hibernate.ddl-auto=update` → `validate`
- Set a strong `jwt.secret` (32+ char random string)
- Update `cors.allowed-origins` to your frontend domain

---

## Features Implemented

- ✅ JWT Auth (register / login / role-based access)
- ✅ Event CRUD with 350-attendee capacity enforcement
- ✅ Real-time WebSocket chat (STOMP over SockJS)
- ✅ Stream join/leave tracking for analytics
- ✅ Live attendee count & online status
- ✅ Admin: create events, change status, view all attendees
- ✅ Analytics: per-event and platform-wide
- ✅ React frontend with protected routes
- ✅ Dark-theme design system
# eventhub
