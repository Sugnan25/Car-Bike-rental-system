package com.rental.carbikerental.repository;

import com.rental.carbikerental.entity.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    List<Booking> findAllByOrderByCreatedAtDesc();

    long countByStatus(String status);
}