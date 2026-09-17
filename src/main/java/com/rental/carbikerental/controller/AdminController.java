package com.rental.carbikerental.controller;

import com.rental.carbikerental.entity.Booking;
import com.rental.carbikerental.entity.Vehicle;
import com.rental.carbikerental.repository.UserRepository;
import com.rental.carbikerental.service.BookingService;
import com.rental.carbikerental.service.VehicleService;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Controller
@RequestMapping("/admin")
public class AdminController {

    private static final String IMAGE_URL_PREFIX = "/uploads/";

    private final VehicleService vehicleService;
    private final UserRepository userRepository;
    private final GridFsTemplate gridFsTemplate;
    private final BookingService bookingService;

    public AdminController(VehicleService vehicleService, UserRepository userRepository, GridFsTemplate gridFsTemplate, BookingService bookingService) {
        this.vehicleService = vehicleService;
        this.userRepository = userRepository;
        this.gridFsTemplate = gridFsTemplate;
        this.bookingService = bookingService;
    }

    @GetMapping
    public String adminDashboard() {
        return "admin/dashboard";
    }

    @GetMapping("/users")
    public String viewUsers(Model model) {
        model.addAttribute("users", userRepository.findAll());
        return "admin/users";
    }

    @GetMapping("/users/delete/{id}")
    public String deleteUser(@PathVariable String id) {
        userRepository.deleteById(id);
        return "redirect:/admin/users";
    }

    @GetMapping("/vehicles")
    public String viewVehicles(Model model) {

        model.addAttribute(
                "vehicles",
                 vehicleService.getAllVehicles()
        );

        return "admin/vehicles";
    }

    @GetMapping("/vehicles/add")
    public String showAddVehicleForm(Model model) {

        model.addAttribute("vehicle", new Vehicle());

        return "admin/add-vehicle";
    }

    @PostMapping("/vehicles/save")
    public String saveVehicle(
            @ModelAttribute Vehicle vehicle,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) {

        String imagePath = saveImageFile(imageFile);
        if (imagePath != null) {
            vehicle.setImageUrl(imagePath);
        }

        vehicleService.saveVehicle(vehicle);

        return "redirect:/admin/vehicles";
    }

    @GetMapping("/vehicles/delete/{id}")
    public String deleteVehicle(
            @PathVariable String id) {

         Vehicle vehicle = vehicleService.getVehicleById(id);
         if (vehicle != null) {
             deleteImage(vehicle.getImageUrl());
         }

         vehicleService.deleteVehicle(id);

        return "redirect:/admin/vehicles";
    }

    @GetMapping("/vehicles/clear")
    public String clearAllVehicles() {
        vehicleService.deleteAllVehicles();
        return "redirect:/admin/vehicles";
    }
    @GetMapping("/vehicles/edit/{id}")
    public String showEditVehicleForm(
        @PathVariable String id,
        Model model) {

    Vehicle vehicle = vehicleService.getVehicleById(id);

    model.addAttribute("vehicle", vehicle);

    return "admin/edit-vehicle";
}

@PostMapping("/vehicles/update")
public String updateVehicle(
        @ModelAttribute Vehicle vehicle,
        @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) {

    String imagePath = saveImageFile(imageFile);
    if (imagePath != null) {
        deleteImage(vehicle.getImageUrl());
        vehicle.setImageUrl(imagePath);
    }

    vehicleService.saveVehicle(vehicle);

    return "redirect:/admin/vehicles";
}

private String saveImageFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
        return null;
    }
    try (InputStream in = file.getInputStream()) {
        ObjectId fileId = gridFsTemplate.store(in, file.getOriginalFilename(), file.getContentType());
        return IMAGE_URL_PREFIX + fileId;
    } catch (IOException e) {
        throw new RuntimeException("Failed to upload image", e);
    }
}

private void deleteImage(String imageUrl) {
    if (imageUrl == null || !imageUrl.startsWith(IMAGE_URL_PREFIX)) {
        return;
    }
    String fileId = imageUrl.substring(IMAGE_URL_PREFIX.length());
    try {
        gridFsTemplate.delete(Query.query(Criteria.where("_id").is(new ObjectId(fileId))));
    } catch (IllegalArgumentException ignored) {
    }
}

@GetMapping("/bookings")
public String adminBookings(Model model) {
    model.addAttribute("bookings", bookingService.getAllBookings());
    model.addAttribute("pendingCount", bookingService.countPending());
    return "admin/bookings";
}

@GetMapping("/bookings/accept/{id}")
public String acceptBooking(@PathVariable String id) {
    bookingService.updateStatus(id, Booking.STATUS_ACCEPTED);
    return "redirect:/admin/bookings";
}

@GetMapping("/bookings/reject/{id}")
public String rejectBooking(@PathVariable String id) {
    bookingService.updateStatus(id, Booking.STATUS_REJECTED);
    return "redirect:/admin/bookings";
}

@GetMapping("/bookings/delete/{id}")
public String deleteBooking(@PathVariable String id) {
    bookingService.deleteBooking(id);
    return "redirect:/admin/bookings";
}

@GetMapping("/customers")
public String adminCustomers() {
    return "redirect:/admin/users";
}
}