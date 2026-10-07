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
@Document(collection = "vehicles")
public class Vehicle {

    @Id
    private String id;

    @Builder.Default
    private String type = "CAR"; // CAR or BIKE

    private String company;

    private String model;

    private String vehicleNumber;

    private String description;

    private Double pricePerKm;

    @Builder.Default
    private String fuelType = "PETROL"; // PETROL, DIESEL, ELECTRIC, CNG

    @Builder.Default
    private Integer seatingCapacity = 4;

    private String transmission; // MANUAL, AUTOMATIC

    private String imageUrl;

    @Builder.Default
    private boolean available = true;

    @Builder.Default
    private Double rating = 4.9;

    @Builder.Default
    private Integer tripsCount = 50;

    @CreatedDate
    private Date createdAt;
}
