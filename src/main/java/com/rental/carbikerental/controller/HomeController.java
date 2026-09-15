package com.rental.carbikerental.controller;

import com.rental.carbikerental.service.VehicleService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    private final VehicleService vehicleService;

    public HomeController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("vehicles", vehicleService.getAllVehicles());
        return "index";
    }
}