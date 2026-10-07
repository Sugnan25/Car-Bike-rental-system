package com.carrental.controllers;

import com.carrental.models.Feedback;
import com.carrental.models.User;
import com.carrental.models.Vehicle;
import com.carrental.repositories.FeedbackRepository;
import com.carrental.services.VehicleService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final VehicleService vehicleService;
    private final FeedbackRepository feedbackRepository;

    @GetMapping("/")
    public String indexPage(@RequestParam(value = "search", required = false) String search,
                            @RequestParam(value = "type", required = false) String type,
                            @RequestParam(value = "fuel", required = false) String fuel,
                            @RequestParam(value = "maxPrice", required = false) Double maxPrice,
                            Model model, HttpSession session) {
        List<Vehicle> vehicles = vehicleService.searchAndFilter(search, type, fuel, maxPrice);
        List<Feedback> feedbacks = feedbackRepository.findAllByOrderByCreatedAtDesc();

        model.addAttribute("vehicles", vehicles);
        model.addAttribute("user", (User) session.getAttribute("user"));
        model.addAttribute("feedbacks", feedbacks);
        return "index";
    }

    @GetMapping("/vehicles")
    public String vehiclesRedirect(HttpSession session) {
        if (session.getAttribute("user") != null) {
            return "redirect:/user/dashboard";
        }
        return "redirect:/";
    }
}
