# Turf Explorer Beginner Project Guide

This guide is for reading the project like a beginner.
It explains where to start, what each file does, and how data moves.

## 1) Read in this order

1. Frontend entry and routes
- frontendip/src/index.js
- frontendip/src/App.js

2. Shared frontend API and auth helpers
- frontendip/src/services/api.js
- frontendip/src/services/authService.js
- frontendip/src/services/turfService.js
- frontendip/src/services/bookingService.js
- frontendip/src/services/slotService.js

3. Main frontend pages
- frontendip/src/pages/Home/Home.js
- frontendip/src/pages/Login/Login.js
- frontendip/src/pages/Register/Register.js
- frontendip/src/pages/TurfListing/TurfListing.js
- frontendip/src/pages/TurfDetails/TurfDetails.js
- frontendip/src/pages/MyBookings/MyBookings.js
- frontendip/src/pages/AddTurf/AddTurf.js
- frontendip/src/pages/MyTurfs/MyTurfs.js
- frontendip/src/pages/AdminDashboard/AdminDashboard.js
- frontendip/src/pages/Profile/Profile.js

4. Backend security and routing
- backendip/src/main/java/com/turfexplorer/config/SecurityConfig.java
- backendip/src/main/java/com/turfexplorer/security/JwtAuthenticationFilter.java
- backendip/src/main/java/com/turfexplorer/security/JwtTokenProvider.java

5. Backend controllers (API endpoints)
- backendip/src/main/java/com/turfexplorer/controller/AuthController.java
- backendip/src/main/java/com/turfexplorer/controller/TurfController.java
- backendip/src/main/java/com/turfexplorer/controller/BookingController.java
- backendip/src/main/java/com/turfexplorer/controller/OwnerController.java
- backendip/src/main/java/com/turfexplorer/controller/AdminController.java
- backendip/src/main/java/com/turfexplorer/controller/PaymentController.java
- backendip/src/main/java/com/turfexplorer/controller/UserController.java
- backendip/src/main/java/com/turfexplorer/controller/ChatController.java

6. Backend business logic (most important)
- backendip/src/main/java/com/turfexplorer/service/AuthService.java
- backendip/src/main/java/com/turfexplorer/service/TurfService.java
- backendip/src/main/java/com/turfexplorer/service/BookingService.java
- backendip/src/main/java/com/turfexplorer/service/OwnerService.java
- backendip/src/main/java/com/turfexplorer/service/AdminService.java
- backendip/src/main/java/com/turfexplorer/service/PaymentService.java

## 2) How one feature flows (simple mental model)

Example: user books a turf.

1. User opens TurfDetails page.
2. Page loads turf + slots through turfService.
3. User clicks Confirm Booking.
4. Frontend calls bookingService.createBooking.
5. Backend BookingController receives request.
6. BookingService validates turf, slot, and date conflict.
7. Booking is created as PENDING.
8. User pays through payment flow.
9. PaymentService verifies and turns booking into CONFIRMED.

## 3) Beginner coding style used in refactor

The code was simplified toward these rules:

- Prefer explicit if/else over short ternary where possible.
- Prefer clear local variables over nested one-liners.
- Prefer loops over long stream chains in complex backend logic.
- Keep each function responsible for one clear action.
- Keep API call and validation steps in visible order.

## 4) Where to edit for common changes

1. Change login behavior
- frontendip/src/pages/Login/Login.js
- backendip/src/main/java/com/turfexplorer/service/AuthService.java

2. Change route access by role
- frontendip/src/App.js
- backendip/src/main/java/com/turfexplorer/config/SecurityConfig.java

3. Change booking rules
- backendip/src/main/java/com/turfexplorer/service/BookingService.java
- backendip/src/main/java/com/turfexplorer/service/PaymentService.java

4. Change turf listing and nearby logic
- frontendip/src/pages/TurfListing/TurfListing.js
- backendip/src/main/java/com/turfexplorer/service/TurfService.java

5. Change owner slot behavior
- frontendip/src/pages/MyTurfs/MyTurfs.js
- backendip/src/main/java/com/turfexplorer/service/OwnerService.java

## 5) Important note

Core frontend and backend flow files have been rewritten in a beginner-friendly, explicit style.
Some framework syntax (React JSX patterns and Spring configuration style) is still present where it is the normal and stable way to express the same behavior.
