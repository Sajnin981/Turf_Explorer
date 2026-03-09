# Turf Explorer Backend - API Documentation

## Quick Reference

### Base URL
```
http://localhost:8080/api
```

### Authentication
Include JWT token in header for protected endpoints:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### 1. Register User
Create a new user account.

**Endpoint:** `POST /api/auth/register`  
**Access:** Public  
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNjc5NTg...",
  "type": "Bearer",
  "id": 3,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "USER"
}
```

**Error Response (400):**
```json
{
  "status": 400,
  "message": "Email already exists",
  "timestamp": "2024-03-07T10:15:30"
}
```

---

### 2. Login
Authenticate and receive JWT token.

**Endpoint:** `POST /api/auth/login`  
**Access:** Public  
**Request Body:**
```json
{
  "email": "admin@turfexplorer.com",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbkB0dXJmZXhwbG9yZXIuY29tIiwiaW...",
  "type": "Bearer",
  "id": 1,
  "name": "Admin User",
  "email": "admin@turfexplorer.com",
  "role": "ADMIN"
}
```

---

## 🏟️ Turf Endpoints (Public)

### 3. Get All Approved Turfs
Retrieve list of all approved turfs.

**Endpoint:** `GET /api/turfs`  
**Access:** Public  

**Success Response (200):**
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
  },
  {
    "id": 2,
    "name": "Cricket Ground Premium",
    "location": "GEC Circle, Chittagong",
    "turfType": "Cricket",
    "pricePerHour": 2000.00,
    "description": "Professional cricket ground with pavilion",
    "imageUrl": "https://example.com/turf2.jpg",
    "ownerId": 2,
    "status": "APPROVED",
    "createdAt": "2024-03-07T10:05:00"
  }
]
```

---

### 4. Get Turf by ID
Get detailed information about a specific turf.

**Endpoint:** `GET /api/turfs/{id}`  
**Access:** Public  
**Path Parameter:** `id` (Long) - Turf ID

**Example:** `GET /api/turfs/1`

**Success Response (200):**
```json
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
```

**Error Response (404):**
```json
{
  "status": 404,
  "message": "Turf not found with id: 1",
  "timestamp": "2024-03-07T11:20:00"
}
```

---

### 5. Get Turf Slots
Get all available time slots for a turf.

**Endpoint:** `GET /api/turfs/{id}/slots`  
**Access:** Public  
**Path Parameter:** `id` (Long) - Turf ID

**Example:** `GET /api/turfs/1/slots`

**Success Response (200):**
```json
[
  {
    "id": 1,
    "turfId": 1,
    "startTime": "06:00:00",
    "endTime": "08:00:00",
    "price": 1200.00,
    "status": "AVAILABLE",
    "createdAt": "2024-03-07T09:00:00"
  },
  {
    "id": 2,
    "turfId": 1,
    "startTime": "08:00:00",
    "endTime": "10:00:00",
    "price": 1500.00,
    "status": "AVAILABLE",
    "createdAt": "2024-03-07T09:00:00"
  }
]
```

---

## 📅 Booking Endpoints (Authenticated)

### 6. Create Booking
Book a turf slot.

**Endpoint:** `POST /api/bookings`  
**Access:** Authenticated Users  
**Headers:** `Authorization: Bearer <token>`  
**Request Body:**
```json
{
  "turfId": 1,
  "slotId": 2,
  "bookingDate": "2024-03-15"
}
```

**Success Response (200):**
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

**Error Response (400):**
```json
{
  "status": 400,
  "message": "Slot is already booked for this date",
  "timestamp": "2024-03-07T12:35:00"
}
```

---

### 7. Get My Bookings
Retrieve all bookings for the authenticated user.

**Endpoint:** `GET /api/bookings/my-bookings`  
**Access:** Authenticated Users  
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
[
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
]
```

---

### 8. Cancel Booking
Cancel a booking.

**Endpoint:** `DELETE /api/bookings/{id}`  
**Access:** Authenticated Users (Own bookings only)  
**Headers:** `Authorization: Bearer <token>`  
**Path Parameter:** `id` (Long) - Booking ID

**Example:** `DELETE /api/bookings/1`

**Success Response (200):**
```json
{
  "message": "Booking cancelled successfully"
}
```

**Error Response (400):**
```json
{
  "status": 400,
  "message": "You can only cancel your own bookings",
  "timestamp": "2024-03-07T13:00:00"
}
```

---

## 🏢 Owner Endpoints (Authenticated)

### 9. Submit Turf
Submit a new turf for admin approval.

**Endpoint:** `POST /api/owner/turfs`  
**Access:** Authenticated Users  
**Headers:** `Authorization: Bearer <token>`  
**Request Body:**
```json
{
  "name": "New Football Arena",
  "location": "Panchlaish, Chittagong",
  "turfType": "Football",
  "pricePerHour": 1800.00,
  "description": "Modern football turf with premium facilities",
  "imageUrl": "https://example.com/turf4.jpg"
}
```

**Success Response (200):**
```json
{
  "id": 4,
  "name": "New Football Arena",
  "location": "Panchlaish, Chittagong",
  "turfType": "Football",
  "pricePerHour": 1800.00,
  "description": "Modern football turf with premium facilities",
  "imageUrl": "https://example.com/turf4.jpg",
  "ownerId": 2,
  "status": "PENDING",
  "createdAt": "2024-03-07T14:00:00"
}
```

---

### 10. Get My Turfs
Get all turfs owned by the authenticated user.

**Endpoint:** `GET /api/owner/my-turfs`  
**Access:** Authenticated Users  
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
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

---

### 11. Delete Turf
Delete own turf.

**Endpoint:** `DELETE /api/owner/turfs/{id}`  
**Access:** Authenticated Users (Own turfs only)  
**Headers:** `Authorization: Bearer <token>`  
**Path Parameter:** `id` (Long) - Turf ID

**Success Response (200):**
```json
{
  "message": "Turf deleted successfully"
}
```

---

### 12. Add Slot
Add a time slot to own turf.

**Endpoint:** `POST /api/owner/turfs/{turfId}/slots`  
**Access:** Authenticated Users (Own turfs only)  
**Headers:** `Authorization: Bearer <token>`  
**Path Parameter:** `turfId` (Long) - Turf ID  
**Request Body:**
```json
{
  "startTime": "18:00:00",
  "endTime": "20:00:00",
  "price": 2000.00
}
```

**Success Response (200):**
```json
{
  "id": 7,
  "turfId": 1,
  "startTime": "18:00:00",
  "endTime": "20:00:00",
  "price": 2000.00,
  "status": "AVAILABLE",
  "createdAt": "2024-03-07T15:00:00"
}
```

---

### 13. Update Slot
Update slot details.

**Endpoint:** `PUT /api/owner/slots/{slotId}`  
**Access:** Authenticated Users (Own turfs only)  
**Headers:** `Authorization: Bearer <token>`  
**Path Parameter:** `slotId` (Long) - Slot ID  
**Request Body:**
```json
{
  "startTime": "18:00:00",
  "endTime": "20:30:00",
  "price": 2200.00
}
```

**Success Response (200):**
```json
{
  "id": 7,
  "turfId": 1,
  "startTime": "18:00:00",
  "endTime": "20:30:00",
  "price": 2200.00,
  "status": "AVAILABLE",
  "createdAt": "2024-03-07T15:00:00"
}
```

---

### 14. Delete Slot
Delete a slot.

**Endpoint:** `DELETE /api/owner/slots/{slotId}`  
**Access:** Authenticated Users (Own turfs only)  
**Headers:** `Authorization: Bearer <token>`  
**Path Parameter:** `slotId` (Long) - Slot ID

**Success Response (200):**
```json
{
  "message": "Slot deleted successfully"
}
```

---

### 15. Get Turf Bookings
View all bookings for own turf.

**Endpoint:** `GET /api/owner/turfs/{turfId}/bookings`  
**Access:** Authenticated Users (Own turfs only)  
**Headers:** `Authorization: Bearer <token>`  
**Path Parameter:** `turfId` (Long) - Turf ID

**Success Response (200):**
```json
[
  {
    "id": 1,
    "userId": 3,
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
]
```

---

### 16. Get Turf Statistics
Get booking statistics for own turf.

**Endpoint:** `GET /api/owner/turfs/{turfId}/statistics`  
**Access:** Authenticated Users (Own turfs only)  
**Headers:** `Authorization: Bearer <token>`  
**Path Parameter:** `turfId` (Long) - Turf ID

**Success Response (200):**
```json
{
  "pending": 2,
  "confirmed": 15,
  "cancelled": 3
}
```

---

## 👑 Admin Endpoints (Admin Only)

### 17. Get Pending Turfs
View all turfs awaiting approval.

**Endpoint:** `GET /api/admin/pending-turfs`  
**Access:** Admin Only  
**Headers:** `Authorization: Bearer <admin-token>`

**Success Response (200):**
```json
[
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
]
```

---

### 18. Get Approved Turfs
View all approved turfs.

**Endpoint:** `GET /api/admin/approved-turfs`  
**Access:** Admin Only  
**Headers:** `Authorization: Bearer <admin-token>`

**Success Response (200):**
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

---

### 19. Approve Turf
Approve a pending turf.

**Endpoint:** `PUT /api/admin/approve/{turfId}`  
**Access:** Admin Only  
**Headers:** `Authorization: Bearer <admin-token>`  
**Path Parameter:** `turfId` (Long) - Turf ID

**Example:** `PUT /api/admin/approve/4`

**Success Response (200):**
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

---

### 20. Reject Turf
Reject a pending turf.

**Endpoint:** `PUT /api/admin/reject/{turfId}`  
**Access:** Admin Only  
**Headers:** `Authorization: Bearer <admin-token>`  
**Path Parameter:** `turfId` (Long) - Turf ID

**Example:** `PUT /api/admin/reject/4`

**Success Response (200):**
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
  "status": "REJECTED",
  "createdAt": "2024-03-07T14:00:00"
}
```

---

## 🔄 Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error, business logic error) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource Not Found |
| 500 | Internal Server Error |

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- Time fields (startTime, endTime) use 24-hour format (HH:mm:ss)
- Date fields use YYYY-MM-DD format
- JWT tokens expire after 24 hours
- Include `Content-Type: application/json` header for POST/PUT requests

---

**Happy Coding! 🚀**
