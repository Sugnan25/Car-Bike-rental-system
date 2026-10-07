package com.carrental.services;

import com.carrental.models.Booking;
import com.carrental.repositories.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;

    public List<Booking> getBookingsForUser(String email) {
        return bookingRepository.findByUserEmailOrderByCreatedAtDesc(email.toLowerCase().trim());
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc();
    }

    public Optional<Booking> getBookingById(String id) {
        return bookingRepository.findById(id);
    }

    public boolean isFirstRideEligible(String email) {
        return bookingRepository.countByUserEmailAndStatus(email.toLowerCase().trim(), "PAID") == 0;
    }

    public Booking createBooking(Booking booking) {
        if (booking.getCreatedAt() == null) {
            booking.setCreatedAt(new Date());
        }
        if (booking.getStatus() == null) {
            booking.setStatus("PENDING");
        }
        return bookingRepository.save(booking);
    }

    public Booking updateStatus(String bookingId, String newStatus) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        b.setStatus(newStatus);
        return bookingRepository.save(b);
    }

    public Booking completePayment(String bookingId, String paymentMethod, String txnId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        b.setStatus("PAID");
        b.setPaymentMethod(paymentMethod);
        b.setUpiTransactionId(txnId);
        return bookingRepository.save(b);
    }

    public void deleteBooking(String id) {
        bookingRepository.deleteById(id);
    }

    public long countPending() {
        return bookingRepository.countByStatus("PENDING");
    }
}
