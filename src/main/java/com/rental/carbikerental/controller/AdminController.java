package com.rental.carbikerental.controller;

import com.rental.carbikerental.entity.Vehicle;
import com.rental.carbikerental.Services.vehicleservice;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/admin")
public class AdminController {

    private final vehicleservice vehicleService;

    public AdminController(vehicleservice vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public String adminDashboard() {
        return "admin/dashboard";
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
            @ModelAttribute Vehicle vehicle) {

        vehicleService.saveVehicle(vehicle);

        return "redirect:/admin/vehicles";
    }

    @GetMapping("/vehicles/delete/{id}")
    public String deleteVehicle(
            @PathVariable Long id) {

        vehicleService.deleteVehicle(id);

        return "redirect:/admin/vehicles";
    }
    @GetMapping("/vehicles/edit/{id}")
    public String showEditVehicleForm(
        @PathVariable Long id,
        Model model) {

    Vehicle vehicle = vehicleService.getVehicleById(id);

    model.addAttribute("vehicle", vehicle);

    return "admin/edit-vehicle";
}

@PostMapping("/vehicles/update")
public String updateVehicle(
        @ModelAttribute Vehicle vehicle) {

    vehicleService.saveVehicle(vehicle);

    return "redirect:/admin/vehicles";
}
}