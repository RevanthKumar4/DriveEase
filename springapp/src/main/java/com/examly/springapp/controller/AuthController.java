package com.examly.springapp.controller;

import com.examly.springapp.exceptions.DuplicateUserException;
import com.examly.springapp.model.LoginDTO;
import com.examly.springapp.model.User;
import com.examly.springapp.service.UserService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    /** Cookie name — must match JwtAuthenticationFilter.JWT_COOKIE_NAME */
    private static final String JWT_COOKIE_NAME = "DriveEase-JWT";
    private static final long COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60; // 24 hours

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user) {
        try {
            User createdUser = userService.createUser(user);

            if (createdUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Never return encoded password to frontend
            createdUser.setPassword(null);

            log.info("New user registered successfully");
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);

        } catch (DuplicateUserException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(buildError("A user with this email already exists"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User user, HttpServletResponse response) {
        LoginDTO loginResponse = userService.loginUser(user);

        if (loginResponse == null) {
            // Generic message — do not reveal whether email or password was wrong
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(buildError("Invalid email or password"));
        }

        ResponseCookie authCookie = createAuthCookie(loginResponse.getToken());
        response.addHeader(HttpHeaders.SET_COOKIE, authCookie.toString());

        log.info("User logged in successfully");

        /*
         * LoginDTO.token has @JsonIgnore.
         * Response JSON contains only: userId, username, userRole.
         */
        return ResponseEntity.ok(loginResponse);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(buildError("Authentication required"));
        }

        User user = userService.getUserByEmail(authentication.getName());

        if (user == null || user.isDeleted()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(buildError("User not found"));
        }

        LoginDTO currentUser = new LoginDTO();
        currentUser.setUserId(user.getUserId());
        currentUser.setUsername(user.getUsername());
        currentUser.setUserRole(user.getUserRole());

        return ResponseEntity.ok(currentUser);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        ResponseCookie deletedCookie = ResponseCookie
                .from(JWT_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, deletedCookie.toString());
        log.info("User logged out");
        return ResponseEntity.ok("Logged out successfully");
    }

    private ResponseCookie createAuthCookie(String token) {
        return ResponseCookie
                .from(JWT_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(COOKIE_MAX_AGE_SECONDS)
                .build();
    }

    private java.util.Map<String, String> buildError(String message) {
        return java.util.Map.of("message", message);
    }
}
