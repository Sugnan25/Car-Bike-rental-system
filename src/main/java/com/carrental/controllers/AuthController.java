package com.carrental.controllers;

import com.carrental.models.User;
import com.carrental.services.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/login")
    public String loginPage(@RequestParam(value = "error", required = false) String error,
                            @RequestParam(value = "verified", required = false) String verified,
                            @RequestParam(value = "registered", required = false) String registered,
                            Model model, HttpSession session) {
        if (session.getAttribute("user") != null) {
            User user = (User) session.getAttribute("user");
            return "ROLE_ADMIN".equals(user.getRole()) ? "redirect:/admin/dashboard" : "redirect:/user/dashboard";
        }
        if (error != null) model.addAttribute("error", "Invalid email or password.");
        if (verified != null) model.addAttribute("success", "Email verified successfully! You can now log in.");
        else if (registered != null) model.addAttribute("success", "Registration successful! Please log in.");
        return "login";
    }

    @PostMapping("/login")
    public String processLogin(@RequestParam("username") String username,
                               @RequestParam("password") String password,
                               HttpSession session) {
        Optional<User> userOpt = userService.findByEmail(username);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            User user = userOpt.get();
            if (!"ROLE_ADMIN".equals(user.getRole()) && !user.isEmailVerified()) {
                userService.sendVerificationOtp(user.getEmail());
                return "redirect:/verify-email?email=" + user.getEmail();
            }
            session.setAttribute("user", user);
            return "ROLE_ADMIN".equals(user.getRole()) ? "redirect:/admin/dashboard" : "redirect:/user/dashboard";
        }
        return "redirect:/login?error=true";
    }

    @GetMapping("/register")
    public String registerPage(Model model, HttpSession session) {
        if (session.getAttribute("user") != null) {
            return "redirect:/user/dashboard";
        }
        return "register";
    }

    @PostMapping("/register")
    public String processRegister(@RequestParam("fullName") String fullName,
                                  @RequestParam("email") String email,
                                  @RequestParam("phone") String phone,
                                  @RequestParam("password") String password,
                                  RedirectAttributes redirectAttributes) {
        try {
            User user = userService.registerUser(fullName, email, phone, password);
            if ("ROLE_ADMIN".equals(user.getRole())) {
                return "redirect:/login?registered=true";
            }
            userService.sendVerificationOtp(email);
            return "redirect:/verify-email?email=" + email;
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/register";
        }
    }

    @GetMapping("/verify-email")
    public String verifyEmailPage(@RequestParam("email") String email, Model model) {
        model.addAttribute("email", email);
        return "verify-email";
    }

    @PostMapping("/verify-email")
    public String processEmailVerification(@RequestParam("email") String email,
                                           @RequestParam("otp") String otp,
                                           RedirectAttributes redirectAttributes) {
        boolean verified = userService.verifyOtp(email, otp);
        if (verified) {
            return "redirect:/login?verified=true";
        }
        redirectAttributes.addFlashAttribute("error", "Invalid or expired OTP code.");
        return "redirect:/verify-email?email=" + email;
    }

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }
}
