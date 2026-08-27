package com.examly.springapp.controller;

import com.examly.springapp.repository.UserRepo;
import com.examly.springapp.service.OtpService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/otp")
public class OtpController {

    private static final Logger log = LoggerFactory.getLogger(OtpController.class);

    @Autowired
    private OtpService otpService;

    @Autowired
    private UserRepo userRepo;

    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {
        String email = request.getEmail();

        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email is required"));
        }

        // Do not send OTP if the email is already registered
        if (userRepo.findByEmail(email.trim().toLowerCase()) != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "A user with this email already exists"));
        }

        try {
            otpService.sendOtp(email);
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));
        } catch (IllegalStateException ex) {
            // Resend cooldown
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            log.error("Failed to send OTP: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to send OTP. Please try again."));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpRequest request) {
        if (request.getEmail() == null || request.getOtp() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email and OTP are required"));
        }

        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtp());

        if (valid) {
            return ResponseEntity.ok(Map.of("message", "OTP verified"));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "Invalid or expired OTP"));
    }

    public static class OtpRequest {
        private String email;
        private String otp;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
    }
}