package com.rental.carbikerental.config;

import com.rental.carbikerental.entity.User;
import com.rental.carbikerental.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    public static final String ADMIN_EMAIL = "admin@gmail.com";
    public static final String ADMIN_PASSWORD = "admin123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    public CommandLineRunner seedDefaultAdmin() {
        return args -> {
            if (userRepository.findByEmail(ADMIN_EMAIL).isEmpty()) {
                User admin = new User();
                admin.setFullName("Administrator");
                admin.setEmail(ADMIN_EMAIL);
                admin.setPhone("0000000000");
                admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
                admin.setRole("ROLE_ADMIN");
                userRepository.save(admin);
                System.out.println("==========================================================================");
                System.out.println("  Default admin created in MongoDB ->");
                System.out.println("    Email   : " + ADMIN_EMAIL);
                System.out.println("    Password: " + ADMIN_PASSWORD);
                System.out.println("==========================================================================");
            }
        };
    }
}