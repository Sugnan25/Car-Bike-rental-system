package com.rental.carbikerental.service;

import com.rental.carbikerental.entity.Booking;
import com.rental.carbikerental.repository.BookingRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;

    public BookingService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public Booking createBooking(Booking booking) {
        booking.setStatus(Booking.STATUS_PENDING);
        booking.setCreatedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    public Booking getBookingById(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    public List<Booking> getBookingsForUser(String userEmail) {
        return bookingRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc();
    }

    public void updateStatus(String id, String status) {
        Booking booking = getBookingById(id);
        booking.setStatus(status);
        bookingRepository.save(booking);
    }

    public long countPending() {
        return bookingRepository.countByStatus(Booking.STATUS_PENDING);
    }

    public void deleteBooking(String id) {
        bookingRepository.deleteById(id);
    }

    public boolean deleteBookingForUser(String id, String userEmail) {
        return bookingRepository.findById(id)
                .filter(booking -> booking.getUserEmail().equals(userEmail))
                .map(booking -> {
                    bookingRepository.delete(booking);
                    return true;
                })
                .orElse(false);
    }
}