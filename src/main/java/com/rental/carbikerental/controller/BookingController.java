package com.rental.carbikerental.controller;

import com.rental.carbikerental.entity.User;
import com.rental.carbikerental.entity.Vehicle;
import com.rental.carbikerental.repository.UserRepository;
import com.rental.carbikerental.service.VehicleService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class BookingController {

    private final VehicleService vehicleService;
    private final UserRepository userRepository;

    public BookingController(VehicleService vehicleService, UserRepository userRepository) {
        this.vehicleService = vehicleService;
        this.userRepository = userRepository;
    }

    @GetMapping("/booking/{id}")
    public String bookingPage(@PathVariable String id, Authentication authentication, Model model) {
        Vehicle vehicle = vehicleService.getVehicleById(id);
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        model.addAttribute("vehicle", vehicle);
        model.addAttribute("user", user);
        return "booking/payment";
    }

    @GetMapping("/booking/{id}/confirm")
    public String confirmBooking(@PathVariable String id, Authentication authentication) {
        return "redirect:/user/dashboard";
    }
}
