package com.carrental.repositories;

import com.carrental.models.EmailVerificationOtp;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationOtpRepository extends MongoRepository<EmailVerificationOtp, String> {
    Optional<EmailVerificationOtp> findTopByEmailOrderByCreatedAtDesc(String email);
    void deleteByEmail(String email);
}
