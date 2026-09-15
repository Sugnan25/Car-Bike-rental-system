package com.rental.carbikerental.controller;

import com.rental.carbikerental.entity.Vehicle;
import com.rental.carbikerental.repository.UserRepository;
import com.rental.carbikerental.service.VehicleService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Controller
@RequestMapping("/admin")
public class AdminController {

    private static final String UPLOAD_DIR = "uploads";

    private final VehicleService vehicleService;
    private final UserRepository userRepository;

    public AdminController(VehicleService vehicleService, UserRepository userRepository) {
        this.vehicleService = vehicleService;
        this.userRepository = userRepository;
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
        vehicle.setImageUrl(imagePath);
    }

    vehicleService.saveVehicle(vehicle);

    return "redirect:/admin/vehicles";
}

private String saveImageFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
        return null;
    }
    try {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + extension;
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        Path filePath = uploadPath.resolve(filename);
        file.transferTo(filePath.toAbsolutePath());
        return "/uploads/" + filename;
    } catch (IOException e) {
        throw new RuntimeException("Failed to upload image", e);
    }
}

@GetMapping("/bookings")
public String adminBookings() {
    return "admin/bookings";
}

@GetMapping("/customers")
public String adminCustomers() {
    return "redirect:/admin/users";
}
}