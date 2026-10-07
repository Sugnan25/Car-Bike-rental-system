package com.carrental.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    private String userId;
    private String userEmail;
    private String userName;
    private String userPhone;

    private String vehicleId;
    private String vehicleName;
    private String vehicleNumber;
    private String vehicleType;

    private String startDate;
    private String endDate;
    private Double estimatedKm;
    private Double pricePerKm;

    private Double subtotal;
    private Double discountAmount;
    private Double totalAmount;
    private String promoCode;

    private String paymentMethod; // UPI, CARD, NETBANKING, QR
    private String upiTransactionId;

    @Builder.Default
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED, PAID, COMPLETED, CANCELLED

    @CreatedDate
    private Date createdAt;
}
