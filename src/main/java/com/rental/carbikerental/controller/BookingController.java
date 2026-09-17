package com.rental.carbikerental.controller;

import com.rental.carbikerental.entity.Booking;
import com.rental.carbikerental.entity.User;
import com.rental.carbikerental.entity.Vehicle;
import com.rental.carbikerental.repository.UserRepository;
import com.rental.carbikerental.service.BookingService;
import com.rental.carbikerental.service.VehicleService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class BookingController {

    private final VehicleService vehicleService;
    private final UserRepository userRepository;
    private final BookingService bookingService;

    public BookingController(VehicleService vehicleService, UserRepository userRepository, BookingService bookingService) {
        this.vehicleService = vehicleService;
        this.userRepository = userRepository;
        this.bookingService = bookingService;
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

    @PostMapping("/booking/{id}")
    public String submitBooking(
            @PathVariable String id,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate,
            @RequestParam(value = "estimatedKm", required = false) Integer estimatedKm,
            Authentication authentication) {

        Vehicle vehicle = vehicleService.getVehicleById(id);
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);

        double rate = vehicle.getPricePerKm() != null ? vehicle.getPricePerKm() : 0d;
        int km = estimatedKm != null ? estimatedKm : 0;

        Booking booking = new Booking();
        booking.setUserId(user != null ? user.getId() : null);
        booking.setUserEmail(authentication.getName());
        booking.setUserName(user != null ? user.getFullName() : authentication.getName());
        booking.setUserPhone(user != null ? user.getPhone() : "");
        booking.setVehicleId(vehicle.getId());
        booking.setVehicleName(vehicle.getCompany() + " " + vehicle.getModel());
        booking.setVehicleNumber(vehicle.getVehicleNumber());
        booking.setVehicleType(vehicle.getType());
        booking.setStartDate(startDate);
        booking.setEndDate(endDate);
        booking.setEstimatedKm(km);
        booking.setPricePerKm(rate);
        booking.setTotalAmount(rate * km);

        bookingService.createBooking(booking);

        return "redirect:/user/bookings?requested=true";
    }

    @GetMapping("/booking/pay/{bookingId}")
    public String paymentPage(@PathVariable String bookingId, Authentication authentication, Model model) {
        Booking booking = bookingService.getBookingById(bookingId);

        if (!booking.getUserEmail().equals(authentication.getName())
                || !Booking.STATUS_ACCEPTED.equals(booking.getStatus())) {
            return "redirect:/user/bookings";
        }

        model.addAttribute("booking", booking);
        return "booking/pay";
    }

    @PostMapping("/booking/pay/{bookingId}")
    public String completePayment(
            @PathVariable String bookingId,
            @RequestParam(value = "paymentMethod", required = false) String paymentMethod,
            Authentication authentication) {

        Booking booking = bookingService.getBookingById(bookingId);

        if (booking.getUserEmail().equals(authentication.getName())
                && Booking.STATUS_ACCEPTED.equals(booking.getStatus())) {

            if (paymentMethod != null && !paymentMethod.isEmpty()) {
                booking.setPaymentMethod(paymentMethod);
            }
            bookingService.updateStatus(bookingId, Booking.STATUS_PAID);
        }

        return "redirect:/user/bookings?paid=true";
    }
}