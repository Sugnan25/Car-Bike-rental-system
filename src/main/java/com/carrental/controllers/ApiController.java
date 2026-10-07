package com.carrental.controllers;

import com.carrental.models.Vehicle;
import com.carrental.services.UserService;
import com.carrental.services.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiController {

    private final UserService userService;
    private final VehicleService vehicleService;

    @PostMapping("/auth/send-verification-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        Map<String, Object> resp = new HashMap<>();
        if (email == null || email.trim().isEmpty()) {
            resp.put("success", false);
            resp.put("message", "Email address is required.");
            return ResponseEntity.badRequest().body(resp);
        }

        try {
            String otp = userService.sendVerificationOtp(email);
            resp.put("success", true);
            resp.put("message", "Verification code sent to " + email);
            resp.put("demoOtp", otp); // included for seamless prototype verification
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", "Failed to send verification code: " + e.getMessage());
            return ResponseEntity.internalServerError().body(resp);
        }
    }

    @PostMapping("/auth/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        Map<String, Object> resp = new HashMap<>();

        if (email == null || otp == null) {
            resp.put("success", false);
            resp.put("message", "Email and OTP code are required.");
            return ResponseEntity.badRequest().body(resp);
        }

        boolean valid = userService.verifyOtp(email, otp);
        if (valid) {
            resp.put("success", true);
            resp.put("message", "Email verified successfully!");
            return ResponseEntity.ok(resp);
        } else {
            resp.put("success", false);
            resp.put("message", "Invalid or expired verification code. Please check and try again.");
            return ResponseEntity.badRequest().body(resp);
        }
    }

    @GetMapping("/vehicles/search")
    public ResponseEntity<List<Vehicle>> searchVehicles(@RequestParam(value = "q", required = false) String q,
                                                        @RequestParam(value = "type", required = false) String type,
                                                        @RequestParam(value = "fuel", required = false) String fuel,
                                                        @RequestParam(value = "maxPrice", required = false) Double maxPrice) {
        return ResponseEntity.ok(vehicleService.searchAndFilter(q, type, fuel, maxPrice));
    }
}
