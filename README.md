# Car & Bike Rental System

A complete car and bike rental web application migrated to Node.js (Express + EJS) for AI Studio.

## Features

- **Public Fleet Browsing**: Explore available cars and bikes with dynamic filters by vehicle type (All, Cars, Bikes) and fuel types (Petrol, Diesel, Electric, Hybrid).
- **User Dashboard**:
  - Direct fleet and car browsing right on login
  - Clean sidebar with My Bookings, Account Settings, and Feedback
  - Customer Feedback submission with star rating and review history
- **Rental Booking & Pricing**:
  - Live calculation based on start date, end date, and estimated kilometers
  - Admin approval workflow (Pending -> Accepted / Rejected)
- **Payment Gateway Flow**:
  - Secure payment simulation with UPI, Credit/Debit Card, and Net Banking
- **Admin Management Panel**:
  - Vehicle fleet management (Add, Edit, Delete, Clear, Photo upload)
  - Booking management (Accept, Reject, Delete requests)
  - Registered customer management
  - Rider feedback review
- **Default Accounts**:
  - **Admin**: `admin@gmail.com` / `admin123`
  - **Rider**: `user@gmail.com` / `user123`

## Running the App

```bash
npm install
npm run dev
```

The server runs on port 3000 (`http://0.0.0.0:3000`).
