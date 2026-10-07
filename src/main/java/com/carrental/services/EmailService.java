package com.carrental.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Car & Bike Rental - Email Verification OTP: " + otp);
            message.setText("Hello,\n\nYour 6-digit verification code is: " + otp + "\n\nThis code expires in 10 minutes.\n\nHappy Riding,\nCar & Bike Rental Team");
            mailSender.send(message);
            log.info("Sent OTP email to {}", toEmail);
        } catch (Exception e) {
            log.warn("Could not send email via SMTP, fallback to console log for OTP: {} to {}", otp, toEmail);
        }
    }
}
