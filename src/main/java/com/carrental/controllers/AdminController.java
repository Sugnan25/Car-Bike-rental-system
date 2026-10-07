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

import java.util.Date;
import java.util.List;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final VehicleService vehicleService;
    private final BookingService bookingService;
    private final UserService userService;
    private final FeedbackRepository feedbackRepository;

    private boolean checkAdmin(HttpSession session) {
        User user = (User) session.getAttribute("user");
        return user != null && "ROLE_ADMIN".equals(user.getRole());
    }

    @GetMapping({"", "/dashboard"})
    public String dashboard(Model model, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        model.addAttribute("pendingBookings", bookingService.countPending());
        return "admin/dashboard";
    }

    @GetMapping("/vehicles")
    public String listVehicles(Model model, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        model.addAttribute("vehicles", vehicleService.getAllVehicles());
        return "admin/vehicles";
    }

    @GetMapping("/vehicles/add")
    public String addVehiclePage(HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        return "admin/add-vehicle";
    }

    @PostMapping("/vehicles/save")
    public String saveVehicle(@ModelAttribute Vehicle vehicle, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        vehicleService.saveVehicle(vehicle);
        return "redirect:/admin/vehicles";
    }

    @GetMapping("/vehicles/edit/{id}")
    public String editVehiclePage(@PathVariable("id") String id, Model model, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        vehicleService.getVehicleById(id).ifPresent(v -> model.addAttribute("vehicle", v));
        return "admin/edit-vehicle";
    }

    @PostMapping("/vehicles/update")
    public String updateVehicle(@ModelAttribute Vehicle vehicle, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        vehicleService.saveVehicle(vehicle);
        return "redirect:/admin/vehicles";
    }

    @GetMapping("/vehicles/delete/{id}")
    public String deleteVehicle(@PathVariable("id") String id, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        vehicleService.deleteVehicle(id);
        return "redirect:/admin/vehicles";
    }

    @GetMapping("/vehicles/clear")
    public String clearVehicles(HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        vehicleService.clearAllVehicles();
        return "redirect:/admin/vehicles";
    }

    @GetMapping("/users")
    public String listUsers(Model model, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        model.addAttribute("users", userService.getAllUsers());
        return "admin/users";
    }

    @GetMapping("/users/delete/{id}")
    public String deleteUser(@PathVariable("id") String id, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        userService.deleteUser(id);
        return "redirect:/admin/users";
    }

    @GetMapping("/bookings")
    public String listBookings(Model model, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        List<Booking> bookings = bookingService.getAllBookings();
        model.addAttribute("bookings", bookings);
        model.addAttribute("pendingCount", bookingService.countPending());
        return "admin/bookings";
    }

    @GetMapping("/bookings/accept/{id}")
    public String acceptBooking(@PathVariable("id") String id, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        bookingService.updateStatus(id, "ACCEPTED");
        return "redirect:/admin/bookings";
    }

    @GetMapping("/bookings/reject/{id}")
    public String rejectBooking(@PathVariable("id") String id, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        bookingService.updateStatus(id, "REJECTED");
        return "redirect:/admin/bookings";
    }

    @GetMapping("/bookings/delete/{id}")
    public String deleteBooking(@PathVariable("id") String id, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        bookingService.deleteBooking(id);
        return "redirect:/admin/bookings";
    }

    @GetMapping("/feedbacks")
    public String listFeedbacks(Model model, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        model.addAttribute("feedbacks", feedbackRepository.findAllByOrderByCreatedAtDesc());
        return "admin/feedbacks";
    }

    @GetMapping("/feedbacks/delete/{id}")
    public String deleteFeedback(@PathVariable("id") String id, HttpSession session) {
        if (!checkAdmin(session)) return "redirect:/login";
        feedbackRepository.deleteById(id);
        return "redirect:/admin/feedbacks";
    }
}
