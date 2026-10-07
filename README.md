# Car & Bike Rental System

A complete full-stack Car and Bike Rental Application with both **Java Spring Boot (MongoDB)** and **Node.js (Express + EJS)** sources ready for deployment and GitHub repository management.

---

## 🚀 Key Features & Recent Updates

1. **Email Verification with OTP**:
   - Secure OTP verification during registration or in user account settings.
   - Built-in verification REST APIs (`/api/auth/send-verification-otp` and `/api/auth/verify-otp`).
   - Visual verified status badges and countdown timers.

2. **Custom Neon Cyan Calendar & Date Picker**:
   - Modern dark mode styling for date pickers (`input[type="date"]`) with neon cyan glow and custom calendar indicators.
   - Quick date preset chips (+Today, +Tomorrow, +2 Days, +1 Week).

3. **Dynamic Search & Advanced Multi-Filter Engine**:
   - Real-time search bar across model, brand/company, and vehicle numbers.
   - Multi-filters for Vehicle Type (All / Cars / Bikes), Fuel Type (Petrol / Diesel / Electric / CNG), Seating Capacity, and Max Price/KM slider.
   - Sorting by Recommended, Price (Low to High, High to Low), Top Rated, and Most Trips.

4. **Dynamic UPI QR Code Payment**:
   - Auto-generated authentic UPI QR codes with encoded amount and booking ID.
   - Scan & Pay support for Google Pay, PhonePe, Paytm, BHIM, and CRED.
   - Live 10-minute payment countdown timer and Copy UPI ID functionality.

---

## 📁 Source Code Architecture

### ☕ Java & MongoDB Sources (`/src/main/java/com/carrental`)
- **Models**:
  - `User.java` (Role-based access, verification token, email verification flag)
  - `Vehicle.java` (Cars & bikes with specs, fuel type, seating capacity, price/km)
  - `Booking.java` (Rental dates, distances, discount codes, payment method)
  - `Feedback.java` (Customer reviews and ratings)
  - `EmailVerificationOtp.java` (OTP verification records)
- **Repositories**:
  - `UserRepository.java`
  - `VehicleRepository.java`
  - `BookingRepository.java`
  - `FeedbackRepository.java`
  - `EmailVerificationOtpRepository.java`
- **Services**:
  - `UserService.java`, `VehicleService.java`, `BookingService.java`, `EmailService.java`, `QrCodeService.java`
- **Controllers**:
  - `AuthController.java`, `HomeController.java`, `UserController.java`, `AdminController.java`, `BookingController.java`, `ApiController.java`
- **Config & Build**:
  - `SecurityConfig.java`, `MongoConfig.java`, `application.properties`, `pom.xml`

### 🌐 Web Server (`server.js`, `views/`, `public/`)
- Pure Node.js / Express web interface with MongoDB Atlas and GridFS image support.

---

## 🔐 Default Credentials

| Account Role | Email | Password |
|--------------|-------|----------|
| **Admin** | `admin@gmail.com` | `admin123` |
| **Rider (Sample)** | `rider@gmail.com` | `rider123` |

---

## 🛠️ Running the Application

```bash
# Node.js runtime
npm install
npm run dev

# Or Maven Spring Boot runtime
mvn clean spring-boot:run
```
