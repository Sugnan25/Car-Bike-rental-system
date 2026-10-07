package com.carrental.repositories;

import com.carrental.models.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    List<Booking> findByStatus(String status);
    List<Booking> findAllByOrderByCreatedAtDesc();
    long countByUserEmailAndStatus(String userEmail, String status);
    long countByStatus(String status);
}
