# Turf Explorer Backend - Project Structure

## 📁 Complete File Structure

```
backendip/
├── .gitignore
├── pom.xml                                 # Maven configuration
├── README.md                               # Main documentation
├── QUICK_START.md                          # Quick setup guide
├── API_DOCUMENTATION.md                    # Complete API reference
├── schema.sql                              # Database schema & sample data
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── turfexplorer/
│   │   │           │
│   │   │           ├── TurfExplorerApplication.java    # Main Spring Boot application
│   │   │           │
│   │   │           ├── config/                         # Configuration Classes
│   │   │           │   ├── SecurityConfig.java         # Spring Security configuration
│   │   │           │   └── CorsConfig.java             # CORS configuration
│   │   │           │
│   │   │           ├── controller/                     # REST Controllers (API Endpoints)
│   │   │           │   ├── AuthController.java         # /api/auth/* endpoints
│   │   │           │   ├── TurfController.java         # /api/turfs/* endpoints
│   │   │           │   ├── BookingController.java      # /api/bookings/* endpoints
│   │   │           │   ├── OwnerController.java        # /api/owner/* endpoints
│   │   │           │   └── AdminController.java        # /api/admin/* endpoints
│   │   │           │
│   │   │           ├── dto/                            # Data Transfer Objects
│   │   │           │   ├── RegisterRequest.java        # Registration request
│   │   │           │   ├── LoginRequest.java           # Login request
│   │   │           │   ├── JwtResponse.java            # JWT response with user info
│   │   │           │   ├── TurfRequest.java            # Turf submission/creation
│   │   │           │   ├── TurfResponse.java           # Turf details response
│   │   │           │   ├── SlotRequest.java            # Slot creation/update
│   │   │           │   ├── SlotResponse.java           # Slot details response
│   │   │           │   ├── BookingRequest.java         # Booking creation
│   │   │           │   ├── BookingResponse.java        # Booking details response
│   │   │           │   └── MessageResponse.java        # Generic message response
│   │   │           │
│   │   │           ├── entity/                         # JPA Entities (Database Models)
│   │   │           │   ├── User.java                   # User entity
│   │   │           │   ├── Turf.java                   # Turf entity
│   │   │           │   ├── Slot.java                   # Slot entity
│   │   │           │   └── Booking.java                # Booking entity
│   │   │           │
│   │   │           ├── enums/                          # Enumerations
│   │   │           │   ├── Role.java                   # USER, ADMIN
│   │   │           │   ├── TurfStatus.java             # PENDING, APPROVED, REJECTED
│   │   │           │   ├── SlotStatus.java             # AVAILABLE, BOOKED
│   │   │           │   └── BookingStatus.java          # PENDING, CONFIRMED, CANCELLED
│   │   │           │
│   │   │           ├── repository/                     # JPA Repositories (Data Access)
│   │   │           │   ├── UserRepository.java         # User data operations
│   │   │           │   ├── TurfRepository.java         # Turf data operations
│   │   │           │   ├── SlotRepository.java         # Slot data operations
│   │   │           │   └── BookingRepository.java      # Booking data operations
│   │   │           │
│   │   │           ├── security/                       # Security & JWT
│   │   │           │   ├── JwtTokenProvider.java       # Generate & validate JWT tokens
│   │   │           │   ├── JwtAuthenticationFilter.java # JWT filter for requests
│   │   │           │   └── UserDetailsServiceImpl.java # Load user for authentication
│   │   │           │
│   │   │           ├── service/                        # Business Logic Layer
│   │   │           │   ├── AuthService.java            # Authentication logic
│   │   │           │   ├── TurfService.java            # Turf browsing logic
│   │   │           │   ├── BookingService.java         # Booking management logic
│   │   │           │   ├── OwnerService.java           # Owner operations logic
│   │   │           │   └── AdminService.java           # Admin operations logic
│   │   │           │
│   │   │           └── exception/                      # Exception Handling
│   │   │               ├── ResourceNotFoundException.java   # 404 errors
│   │   │               ├── BadRequestException.java        # 400 errors
│   │   │               └── GlobalExceptionHandler.java     # Global error handler
│   │   │
│   │   └── resources/
│   │       └── application.properties      # Application configuration
│   │
│   └── test/
│       └── java/
│           └── com/
│               └── turfexplorer/
│                   └── TurfExplorerApplicationTests.java
│
└── target/                                 # Compiled files (generated)
```

## 📊 File Count Summary

| Category | Count | Files |
|----------|-------|-------|
| **Controllers** | 5 | Auth, Turf, Booking, Owner, Admin |
| **Services** | 5 | Auth, Turf, Booking, Owner, Admin |
| **Repositories** | 4 | User, Turf, Slot, Booking |
| **Entities** | 4 | User, Turf, Slot, Booking |
| **DTOs** | 10 | Request/Response objects |
| **Enums** | 4 | Role, TurfStatus, SlotStatus, BookingStatus |
| **Security** | 3 | JWT Provider, Filter, UserDetailsService |
| **Config** | 2 | Security, CORS |
| **Exception** | 3 | Custom exceptions + Global handler |
| **Documentation** | 4 | README, Quick Start, API Docs, Schema |
| **Total Java Files** | 42+ | Complete backend implementation |

## 🎯 Layer Responsibilities

### Controller Layer
- Handle HTTP requests/responses
- Validate input (via @Valid)
- Extract authenticated user info
- Call service layer
- Return appropriate HTTP status codes

### Service Layer
- Implement business logic
- Enforce business rules
- Manage transactions
- Call repository layer
- Transform entities to DTOs

### Repository Layer
- Database operations (CRUD)
- Custom queries
- Extend JpaRepository
- Handle data persistence

### Security Layer
- JWT token generation/validation
- User authentication
- Authorization checks
- Password encryption

### Configuration Layer
- Spring Security setup
- CORS policy
- Bean definitions

### Exception Layer
- Custom exceptions
- Global error handling
- Validation error formatting
- Consistent error responses

## 🔐 Security Flow

```
Client Request
    ↓
JwtAuthenticationFilter (Extract & validate token)
    ↓
UserDetailsService (Load user details)
    ↓
SecurityContext (Set authentication)
    ↓
Controller (Check @PreAuthorize if needed)
    ↓
Service (Business logic with user context)
    ↓
Repository (Data access)
    ↓
Response
```

## 📋 API Endpoint Mapping

### Public Endpoints
- `POST /api/auth/register` → AuthController → AuthService
- `POST /api/auth/login` → AuthController → AuthService
- `GET /api/turfs` → TurfController → TurfService
- `GET /api/turfs/{id}` → TurfController → TurfService
- `GET /api/turfs/{id}/slots` → TurfController → TurfService

### Authenticated Endpoints
- `POST /api/bookings` → BookingController → BookingService
- `GET /api/bookings/my-bookings` → BookingController → BookingService
- `DELETE /api/bookings/{id}` → BookingController → BookingService
- `POST /api/owner/turfs` → OwnerController → OwnerService
- `GET /api/owner/my-turfs` → OwnerController → OwnerService
- `DELETE /api/owner/turfs/{id}` → OwnerController → OwnerService
- `POST /api/owner/turfs/{turfId}/slots` → OwnerController → OwnerService
- `PUT /api/owner/slots/{slotId}` → OwnerController → OwnerService
- `DELETE /api/owner/slots/{slotId}` → OwnerController → OwnerService
- `GET /api/owner/turfs/{turfId}/bookings` → OwnerController → OwnerService
- `GET /api/owner/turfs/{turfId}/statistics` → OwnerController → OwnerService

### Admin Only Endpoints
- `GET /api/admin/pending-turfs` → AdminController → AdminService
- `GET /api/admin/approved-turfs` → AdminController → AdminService
- `PUT /api/admin/approve/{turfId}` → AdminController → AdminService
- `PUT /api/admin/reject/{turfId}` → AdminController → AdminService

## 🗄️ Database Schema

### Tables
1. **users** - User accounts and authentication
2. **turfs** - Sports turf listings
3. **slots** - Time slots for turfs
4. **bookings** - User bookings

### Relationships
- User → Turfs (One to Many) - A user can own multiple turfs
- User → Bookings (One to Many) - A user can make multiple bookings
- Turf → Slots (One to Many) - A turf has multiple time slots
- Turf → Bookings (One to Many) - A turf can have multiple bookings
- Slot → Bookings (One to Many) - A slot can be booked multiple times (different dates)

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| Spring Boot 3.1.5 | Application framework |
| Spring Security | Authentication & authorization |
| Spring Data JPA | Database operations |
| MySQL | Relational database |
| JWT (JJWT) | Token-based authentication |
| Lombok | Reduce boilerplate code |
| Maven | Dependency management |
| Jakarta Validation | Input validation |

## 📦 Key Dependencies (from pom.xml)

- `spring-boot-starter-web` - REST API support
- `spring-boot-starter-data-jpa` - Database integration
- `spring-boot-starter-security` - Security features
- `spring-boot-starter-validation` - Input validation
- `mysql-connector-j` - MySQL driver
- `jjwt-api`, `jjwt-impl`, `jjwt-jackson` - JWT support
- `lombok` - Code generation

## 🚀 Getting Started

1. **Read:** [QUICK_START.md](QUICK_START.md) - 5-minute setup
2. **Configure:** Update database credentials in `application.properties`
3. **Setup:** Run `schema.sql` to create database
4. **Run:** Execute `mvn spring-boot:run`
5. **Test:** Use [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for endpoints

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| README.md | Complete project documentation |
| QUICK_START.md | Quick setup guide (5 minutes) |
| API_DOCUMENTATION.md | Full API reference with examples |
| PROJECT_STRUCTURE.md | This file - project structure overview |
| schema.sql | Database schema & sample data |

---

**Complete Backend Implementation Ready! 🎉**

All layers implemented following clean architecture principles with proper separation of concerns.
