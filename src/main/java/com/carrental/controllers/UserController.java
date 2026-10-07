package com.carrental.controllers;

import com.carrental.models.Booking;
import com.carrental.models.Feedback;
import com.carrental.models.User;
import com.carrental.models.Vehicle;
import com.carrental.repositories.FeedbackRepository;
import com.carrental.services.BookingService;
import com.carrental.services.UserService;
import com.carrental.services.VehicleService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Date;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class UserController {

    private final VehicleService vehicleService;
    private final BookingService bookingService;
    private final UserService userService;
    private final FeedbackRepository feedbackRepository;

    private User getAuthenticatedUser(HttpSession session) {
        return (User) session.getAttribute("user");
    }

    @GetMapping("/user/dashboard")
    public String userDashboard(Model model, HttpSession session,
                                @RequestParam(value = "feedbackSuccess", required = false) Boolean feedbackSuccess) {
        User user = getAuthenticatedUser(session);
        if (user == null) return "redirect:/login";

        List<Vehicle> vehicles = vehicleService.getAvailableVehicles();
        List<Booking> userBookings = bookingService.getBookingsForUser(user.getEmail());
        long activeCount = userBookings.stream()
                .filter(b -> "ACCEPTED".equals(b.getStatus()) || "PAID".equals(b.getStatus()))
                .count();

        boolean isFirstRide = bookingService.isFirstRideEligible(user.getEmail());
        List<Feedback> feedbacks = feedbackRepository.findAllByOrderByCreatedAtDesc();

        model.addAttribute("user", user);
        model.addAttribute("vehicles", vehicles);
        model.addAttribute("myBookingsCount", userBookings.size());
        model.addAttribute("activeBookingsCount", activeCount);
        model.addAttribute("isFirstRide", isFirstRide);
        model.addAttribute("feedbacks", feedbacks);
        model.addAttribute("feedbackSuccess", feedbackSuccess != null && feedbackSuccess);

        return "user/dashboard";
    }

    @GetMapping("/my-bookings")
    public String myBookings(Model model, HttpSession session) {
        User user = getAuthenticatedUser(session);
        if (user == null) return "redirect:/login";

        List<Booking> bookings = bookingService.getBookingsForUser(user.getEmail());
        model.addAttribute("user", user);
        model.addAttribute("bookings", bookings);
        return "user/bookings";
    }

    @GetMapping("/user/bookings")
    public String userBookingsRedirect() {
        return "redirect:/my-bookings";
    }

    @GetMapping("/my-bookings/delete/{id}")
    public String deleteBooking(@PathVariable("id") String id, HttpSession session) {
        User user = getAuthenticatedUser(session);
        if (user == null) return "redirect:/login";

        bookingService.getBookingById(id).ifPresent(b -> {
            if (b.getUserEmail().equalsIgnoreCase(user.getEmail())) {
                bookingService.deleteBooking(id);
            }
        });
        return "redirect:/my-bookings?deleted=true";
    }

    @GetMapping("/account/settings")
    public String accountSettings(Model model, HttpSession session) {
        User user = getAuthenticatedUser(session);
        if (user == null) return "redirect:/login";

        // Refresh user from DB
        userService.findByEmail(user.getEmail()).ifPresent(u -> {
            session.setAttribute("user", u);
            model.addAttribute("user", u);
        });

        return "user/settings";
    }

    @PostMapping("/account/settings")
    public String updateSettings(@RequestParam("fullName") String fullName,
                                 @RequestParam("phone") String phone,
                                 @RequestParam(value = "newPassword", required = false) String newPassword,
                                 @RequestParam(value = "confirmPassword", required = false) String confirmPassword,
                                 HttpSession session, RedirectAttributes redirectAttributes) {
        User user = getAuthenticatedUser(session);
        if (user == null) return "redirect:/login";

        if (newPassword != null && !newPassword.trim().isEmpty()) {
            if (!newPassword.equals(confirmPassword)) {
                redirectAttributes.addFlashAttribute("error", "Passwords do not match.");
                return "redirect:/account/settings";
            }
        }

        User updated = userService.updateProfile(user.getEmail(), fullName, phone, newPassword);
        session.setAttribute("user", updated);
        return "redirect:/account/settings?saved=true";
    }

    @PostMapping("/user/feedback")
    public String submitFeedback(@RequestParam("rating") Double rating,
                                 @RequestParam("category") String category,
                                 @RequestParam("comments") String comments,
                                 HttpSession session) {
        User user = getAuthenticatedUser(session);
        if (user == null) return "redirect:/login";

        Feedback fb = Feedback.builder()
                .userId(user.getId())
                .userName(user.getFullName() != null ? user.getFullName() : user.getEmail())
                .userEmail(user.getEmail())
                .rating(rating != null ? rating : 5.0)
                .category(category)
                .comments(comments)
                .createdAt(new Date())
                .build();

        feedbackRepository.save(fb);
        return "redirect:/user/dashboard?feedbackSuccess=true#feedback-section";
    }
}
