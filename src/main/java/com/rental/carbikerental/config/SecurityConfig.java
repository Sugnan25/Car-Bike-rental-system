package com.rental.carbikerental.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                "/",
                                "/register",
                                "/login",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/uploads/**"
                        ).permitAll()

                        .requestMatchers("/admin/**")
                        .hasRole("ADMIN")

                        .requestMatchers("/user/**")
                        .hasRole("USER")

                        .requestMatchers("/booking/**")
                        .authenticated()

                        .anyRequest()
                        .authenticated())

                .formLogin(form -> form

                        .loginPage("/login")
                        .defaultSuccessUrl("/loginSuccess", true)
                        .permitAll())

                .logout(logout -> logout
                        .logoutSuccessUrl("/login")
                        .permitAll())

                .csrf(csrf -> csrf.disable());

        return http.build();
    }
}