package com.carrental.controllers;

import com.carrental.models.Booking;
import com.carrental.models.User;
import com.carrental.models.Vehicle;
import com.carrental.services.BookingService;
import com.carrental.services.QrCodeService;
import com.carrental.services.VehicleService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Optional;

@Controller
@RequestMapping("/booking")
@RequiredArgsConstructor
public class BookingController {

    private final VehicleService vehicleService;
    private final BookingService bookingService;
    private final QrCodeService qrCodeService;

    private User getAuthenticatedUser(HttpSession session) {
        return (User) session.getAttribute("user");
    }

    @GetMapping("/{id}")
    public String bookingForm(@PathVariable("id") String id, Model model, HttpSession session) {
        User user = getAuthenticatedUser(session);
        if (user == null) return "redirect:/login";

        Optional<Vehicle> vehicleOpt = vehicleService.getVehicleById(id);
        if (vehicleOpt.isEmpty()) return "redirect:/user/dashboard";

        boolean isFirstRide = bookingService.isFirstRideEligible(user.getEmail());

        model.addAttribute("vehicle", vehicleOpt.get());
        model.addAttribute("user", user);
        model.addAttribute("isFirstRide", isFirstRide);
        return "booking/payment";
    }

    @PostMapping("/{id}")
    public String submitBooking(@PathVariable("id") String id,
                                @RequestParam("startDate") String startDate,
                                @RequestParam("endDate") String endDate,
                                @RequestParam("estimatedKm") Double estimatedKm,
                                @RequestParam(value = "promoCode", required = false) String promoCode,
                                HttpSession session) {
        User user = getAuthenticatedUser(session);
        if (user == null) return "redirect:/login";

        Vehicle vehicle = vehicleService.getVehicleById(id).orElse(null);
        if (vehicle == null) return "redirect:/user/dashboard";

        double km = estimatedKm != null ? estimatedKm : 0;
        double rate = vehicle.getPricePerKm() != null ? vehicle.getPricePerKm() : 10;
        double subtotal = rate * km;

        boolean isFirst = bookingService.isFirstRideEligible(user.getEmail());
        boolean appliesDiscount = isFirst || "FIRST10".equalsIgnoreCase(promoCode != null ? promoCode.trim() : "");
        double discount = appliesDiscount ? Math.round(subtotal * 0.10) : 0;
        double total = Math.max(0, subtotal - discount);

        Booking booking = Booking.builder()
                .userId(user.getId())
                .userEmail(user.getEmail())
                .userName(user.getFullName() != null ? user.getFullName() : user.getEmail())
                .userPhone(user.getPhone() != null ? user.getPhone() : "")
                .vehicleId(vehicle.getId())
                .vehicleName(vehicle.getCompany() + " " + vehicle.getModel())
                .vehicleNumber(vehicle.getVehicleNumber())
                .vehicleType(vehicle.getType())
                .startDate(startDate)
                .endDate(endDate)
                .estimatedKm(km)
                .pricePerKm(rate)
                .subtotal(subtotal)
                .discountAmount(discount)
                .totalAmount(total)
                .promoCode(appliesDiscount ? "FIRST10" : null)
                .status("PENDING")
                .createdAt(new Date())
                .build();

        bookingService.createBooking(booking);
        return "redirect:/my-bookings?requested=true";
    }

    @GetMapping("/pay/{bookingId}")
    public String payPage(@PathVariable("bookingId") String bookingId, Model model, HttpSession session) {
        User user = getAuthenticatedUser(session);
        if (user == null) return "redirect:/login";

        Optional<Booking> bOpt = bookingService.getBookingById(bookingId);
        if (bOpt.isEmpty() || !bOpt.get().getUserEmail().equalsIgnoreCase(user.getEmail())) {
            return "redirect:/my-bookings";
        }

        Booking booking = bOpt.get();
        String qrDataUrl = qrCodeService.generateUpiQrBase64(
                "carrental@okhdfcbank",
                "CarBike Rental",
                booking.getTotalAmount() != null ? booking.getTotalAmount() : 0,
                "Booking-" + booking.getId()
        );

        model.addAttribute("booking", booking);
        model.addAttribute("user", user);
        model.addAttribute("qrCodeImage", qrDataUrl);
        return "booking/pay";
    }

    @PostMapping("/pay/{bookingId}")
    public String processPayment(@PathVariable("bookingId") String bookingId,
                                 @RequestParam(value = "paymentMethod", defaultValue = "upi") String paymentMethod,
                                 @RequestParam(value = "upiTxnId", required = false) String upiTxnId,
                                 HttpSession session) {
        User user = getAuthenticatedUser(session);
        if (user == null) return "redirect:/login";

        bookingService.completePayment(bookingId, paymentMethod, upiTxnId);
        return "redirect:/my-bookings?paid=true";
    }
}
