package com.rental.carbikerental.controller;

import com.rental.carbikerental.entity.User;
import com.rental.carbikerental.repository.UserRepository;
import com.rental.carbikerental.service.BookingService;
import com.rental.carbikerental.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/user")
public class UserController {

    private final BookingService bookingService;
    private final UserRepository userRepository;
    private final UserService userService;

    public UserController(BookingService bookingService, UserRepository userRepository, UserService userService) {
        this.bookingService = bookingService;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @GetMapping("/bookings")
    public String myBookings(Authentication authentication, Model model) {
        model.addAttribute("bookings", bookingService.getBookingsForUser(authentication.getName()));
        return "user/bookings";
    }

    @GetMapping("/bookings/delete/{id}")
    public String deleteBooking(@PathVariable String id, Authentication authentication) {
        boolean deleted = bookingService.deleteBookingForUser(id, authentication.getName());
        return deleted ? "redirect:/user/bookings?deleted=true" : "redirect:/user/bookings";
    }

    @GetMapping("/settings")
    public String accountSettings(Authentication authentication, Model model) {
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        model.addAttribute("user", user);
        return "user/settings";
    }

    @PostMapping("/settings")
    public String updateAccountSettings(
            @RequestParam("fullName") String fullName,
            @RequestParam("phone") String phone,
            @RequestParam(value = "newPassword", required = false) String newPassword,
            @RequestParam(value = "confirmPassword", required = false) String confirmPassword,
            Authentication authentication,
            Model model) {

        if (newPassword != null && !newPassword.isBlank()
                && !newPassword.equals(confirmPassword)) {
            model.addAttribute("user", userRepository.findByEmail(authentication.getName()).orElse(null));
            model.addAttribute("error", "Passwords do not match. Please try again.");
            return "user/settings";
        }

        userService.updateProfile(authentication.getName(), fullName, phone, newPassword);

        return "redirect:/user/settings?saved=true";
    }
}