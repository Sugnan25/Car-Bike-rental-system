package com.carrental.services;

import com.carrental.models.EmailVerificationOtp;
import com.carrental.models.User;
import com.carrental.repositories.EmailVerificationOtpRepository;
import com.carrental.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EmailVerificationOtpRepository otpRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim());
    }

    public User registerUser(String fullName, String email, String phone, String password) {
        String cleanEmail = email.toLowerCase().trim();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new RuntimeException("Email already registered");
        }

        String role = cleanEmail.equalsIgnoreCase("admin@gmail.com") ? "ROLE_ADMIN" : "ROLE_USER";

        User user = User.builder()
                .fullName(fullName.trim())
                .email(cleanEmail)
                .phone(phone.trim())
                .password(passwordEncoder.encode(password))
                .role(role)
                .enabled(true)
                .emailVerified(cleanEmail.equalsIgnoreCase("admin@gmail.com"))
                .createdAt(new Date())
                .build();

        return userRepository.save(user);
    }

    public String sendVerificationOtp(String email) {
        String cleanEmail = email.toLowerCase().trim();
        String otp = String.format("%06d", new Random().nextInt(999999));

        EmailVerificationOtp verification = EmailVerificationOtp.builder()
                .email(cleanEmail)
                .otpCode(otp)
                .verified(false)
                .expiresAt(new Date(System.currentTimeMillis() + 10 * 60 * 1000)) // 10 minutes
                .createdAt(new Date())
                .build();

        otpRepository.save(verification);
        emailService.sendOtpEmail(cleanEmail, otp);
        return otp;
    }

    public boolean verifyOtp(String email, String otpCode) {
        String cleanEmail = email.toLowerCase().trim();
        Optional<EmailVerificationOtp> otpOpt = otpRepository.findTopByEmailOrderByCreatedAtDesc(cleanEmail);

        if (otpOpt.isPresent()) {
            EmailVerificationOtp otp = otpOpt.get();
            if (!otp.isVerified() && otp.getOtpCode().equals(otpCode.trim()) && otp.getExpiresAt().after(new Date())) {
                otp.setVerified(true);
                otpRepository.save(otp);

                // Update user emailVerified if user exists
                userRepository.findByEmail(cleanEmail).ifPresent(u -> {
                    u.setEmailVerified(true);
                    userRepository.save(u);
                });
                return true;
            }
        }
        return false;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void deleteUser(String id) {
        userRepository.findById(id).ifPresent(u -> {
            if (!"admin@gmail.com".equalsIgnoreCase(u.getEmail())) {
                userRepository.deleteById(id);
            }
        });
    }

    public User updateProfile(String email, String fullName, String phone, String newPassword) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (fullName != null && !fullName.trim().isEmpty()) {
            user.setFullName(fullName.trim());
        }
        if (phone != null && !phone.trim().isEmpty()) {
            user.setPhone(phone.trim());
        }
        if (newPassword != null && !newPassword.trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        return userRepository.save(user);
    }
}
