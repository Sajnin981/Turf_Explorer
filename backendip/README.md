# Turf Explorer Backend

A comprehensive REST API backend for the Turf Explorer platform - a turf booking system built with Spring Boot, Spring Security, JWT authentication, and MySQL.

## 🚀 Features

- **JWT Authentication** - Secure login and registration
- **Role-based Access Control** - USER and ADMIN roles
- **RESTful API** - Clean, organized endpoints
- **Layered Architecture** - Controller → Service → Repository pattern
- **MySQL Database** - Relational data storage
- **Exception Handling** - Global error handling
- **CORS Support** - Frontend integration ready

## 📋 Prerequisites

Before running this application, ensure you have:

- **Java 17** or higher
- **Maven 3.6+**
- **MySQL 8.0+**
- A REST client (Postman, Thunder Client, etc.)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
cd backendip
```

### 2. Configure MySQL Database

Create a MySQL database:

```sql
CREATE DATABASE turf_explorer;
```

Update database credentials in `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/turf_explorer
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
```

### 3. Run the SQL Schema

Execute the schema file to create tables and insert sample data:

```bash
mysql -u your_username -p turf_explorer < schema.sql
```

Or use MySQL Workbench to run the `schema.sql` file.

### 4. Build the Project

```bash
mvn clean install
```

### 5. Run the Application

```bash
mvn spring-boot:run
```

The server will start at `http://localhost:8080`

## 📁 Project Structure

```
backendip/
├── src/
│   ├── main/
│   │   ├── java/com/turfexplorer/
│   │   │   ├── config/           # Security & CORS configuration
│   │   │   ├── controller/       # REST API endpoints
│   │   │   ├── dto/              # Data Transfer Objects
│   │   │   ├── entity/           # JPA entities
│   │   │   ├── enums/            # Enumerations
│   │   │   ├── exception/        # Exception handling
│   │   │   ├── repository/       # JPA repositories
│   │   │   ├── security/         # JWT & authentication
│   │   │   └── service/          # Business logic
│   │   └── resources/
│   │       └── application.properties
│   └── test/
├── pom.xml
├── schema.sql
└── README.md
```

## 🔑 Default Credentials

After running the schema, you can login with:

**Admin Account:**
- Email: `admin@turfexplorer.com`
- Password: `admin123`

**User Account:**
- Email: `john@example.com`
- Password: `user123`

## 📡 API Endpoints

### Authentication APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |

### User APIs (Turf Browsing)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/turfs` | Get all approved turfs | Public |
| GET | `/api/turfs/{id}` | Get turf details | Public |
| GET | `/api/turfs/{id}/slots` | Get turf slots | Public |

### Booking APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/bookings` | Create booking | Authenticated |
| GET | `/api/bookings/my-bookings` | Get user bookings | Authenticated |
| DELETE | `/api/bookings/{id}` | Cancel booking | Authenticated |

### Turf Owner APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/owner/turfs` | Submit new turf | Authenticated |
| GET | `/api/owner/my-turfs` | Get owner's turfs | Authenticated |
| DELETE | `/api/owner/turfs/{id}` | Delete turf | Authenticated |
| POST | `/api/owner/turfs/{turfId}/slots` | Add slot | Authenticated |
| PUT | `/api/owner/slots/{slotId}` | Update slot | Authenticated |
| DELETE | `/api/owner/slots/{slotId}` | Delete slot | Authenticated |
| GET | `/api/owner/turfs/{turfId}/bookings` | View turf bookings | Authenticated |
| GET | `/api/owner/turfs/{turfId}/statistics` | Get booking stats | Authenticated |

### Admin APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/pending-turfs` | Get pending turfs | Admin Only |
| GET | `/api/admin/approved-turfs` | Get approved turfs | Admin Only |
| PUT | `/api/admin/approve/{turfId}` | Approve turf | Admin Only |
| PUT | `/api/admin/reject/{turfId}` | Reject turf | Admin Only |

## 📝 API Request & Response Examples

### 1. Register User

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "id": 3,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "USER"
}
```

### 2. Login

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@turfexplorer.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "id": 1,
  "name": "Admin User",
  "email": "admin@turfexplorer.com",
  "role": "ADMIN"
}
```

### 3. Get All Turfs

**Request:**
```http
GET /api/turfs
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Chittagong Sports Arena",
    "location": "Agrabad, Chittagong",
    "turfType": "Football",
    "pricePerHour": 1500.00,
    "description": "Premium football turf with floodlights",
    "imageUrl": "https://example.com/turf1.jpg",
    "ownerId": 2,
    "status": "APPROVED",
    "createdAt": "2024-03-07T10:00:00"
  }
]
```

### 4. Create Booking

**Request:**
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "turfId": 1,
  "slotId": 2,
  "bookingDate": "2024-03-15"
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 2,
  "turfId": 1,
  "slotId": 2,
  "bookingDate": "2024-03-15",
  "status": "CONFIRMED",
  "createdAt": "2024-03-07T12:30:00",
  "turfName": "Chittagong Sports Arena",
  "turfLocation": "Agrabad, Chittagong",
  "slotTime": "08:00:00 - 10:00:00",
  "price": 1500.00
}
```

### 5. Submit Turf (Owner)

**Request:**
```http
POST /api/owner/turfs
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Football Arena",
  "location": "Panchlaish, Chittagong",
  "turfType": "Football",
  "pricePerHour": 1800.00,
  "description": "Modern football turf",
  "imageUrl": "https://example.com/turf4.jpg"
}
```

**Response:**
```json
{
  "id": 4,
  "name": "New Football Arena",
  "location": "Panchlaish, Chittagong",
  "turfType": "Football",
  "pricePerHour": 1800.00,
  "description": "Modern football turf",
  "imageUrl": "https://example.com/turf4.jpg",
  "ownerId": 2,
  "status": "PENDING",
  "createdAt": "2024-03-07T14:00:00"
}
```

### 6. Approve Turf (Admin)

**Request:**
```http
PUT /api/admin/approve/4
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "id": 4,
  "name": "New Football Arena",
  "location": "Panchlaish, Chittagong",
  "turfType": "Football",
  "pricePerHour": 1800.00,
  "description": "Modern football turf",
  "imageUrl": "https://example.com/turf4.jpg",
  "ownerId": 2,
  "status": "APPROVED",
  "createdAt": "2024-03-07T14:00:00"
}
```

## 🔐 Security

- Passwords are encrypted using BCrypt
- JWT tokens expire after 24 hours (configurable)
- Role-based access control with Spring Security
- CORS enabled for frontend integration

## 🧪 Testing

Run tests with:

```bash
mvn test
```

## 🐛 Common Issues & Solutions

### Issue: Port 8080 already in use
**Solution:** Change the port in `application.properties`:
```properties
server.port=8081
```

### Issue: MySQL connection refused
**Solution:** 
1. Ensure MySQL is running
2. Verify credentials in `application.properties`
3. Check MySQL port (default: 3306)

### Issue: JWT token not working
**Solution:** 
1. Include token in header: `Authorization: Bearer <token>`
2. Ensure token hasn't expired
3. Check JWT secret in `application.properties`

## 📚 Technologies Used

- **Java 17**
- **Spring Boot 3.1.5**
- **Spring Security**
- **Spring Data JPA**
- **MySQL 8.0**
- **JWT (JSON Web Tokens)**
- **Maven**
- **Lombok**

## 🤝 Integration with Frontend

To connect with the React frontend:

1. Start the backend on `http://localhost:8080`
2. Update frontend API base URL to point to `http://localhost:8080/api`
3. Include JWT token in Authorization header for protected routes

Example fetch from frontend:
```javascript
const response = await fetch('http://localhost:8080/api/turfs', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 📞 Support

For issues or questions, please check:
- Application logs in console
- MySQL error logs
- Spring Boot documentation

## 📄 License

This project is for educational purposes.

---

**Built with ❤️ for Turf Explorer**
