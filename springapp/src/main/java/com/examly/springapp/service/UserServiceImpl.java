package com.examly.springapp.service;

import com.examly.springapp.config.JwtUtils;
import com.examly.springapp.exceptions.DuplicateUserException;
import com.examly.springapp.model.LoginDTO;
import com.examly.springapp.model.User;
import com.examly.springapp.repository.UserRepo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    public User createUser(User user) {
        User existingUser = userRepo.findByEmail(user.getEmail().toLowerCase().trim());

        if (existingUser != null) {
            throw new DuplicateUserException("A user with this email already exists");
        }

        // Store email in lowercase for consistent lookups
        user.setEmail(user.getEmail().toLowerCase().trim());
        // Never store plaintext password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        log.info("Creating new user");
        return userRepo.save(user);
    }

    @Override
    public LoginDTO loginUser(User user) {
        if (user.getEmail() == null || user.getPassword() == null) {
            return null;
        }

        User existingUser = userRepo.findByEmail(user.getEmail().toLowerCase().trim());

        if (existingUser == null || existingUser.isDeleted()) {
            // Use same timing path to prevent user enumeration via timing attacks
            passwordEncoder.matches("dummy", "$2a$10$dummy.hash.that.takes.same.time");
            return null;
        }

        boolean passwordMatches = passwordEncoder.matches(
            user.getPassword(),
            existingUser.getPassword()
        );

        if (!passwordMatches) {
            return null;
        }

        String token = jwtUtils.generateToken(existingUser.getEmail(), existingUser.getUserRole());

        LoginDTO loginDTO = new LoginDTO();
        /*
         * Token is used only internally by AuthController to create the HttpOnly cookie.
         * LoginDTO.token has @JsonIgnore, so it will not appear in API response JSON.
         */
        loginDTO.setToken(token);
        loginDTO.setUserId(existingUser.getUserId());
        loginDTO.setUsername(existingUser.getUsername());
        loginDTO.setUserRole(existingUser.getUserRole());

        return loginDTO;
    }

    @Override
    public User getUserByEmail(String email) {
        if (email == null) return null;
        return userRepo.findByEmail(email.toLowerCase().trim());
    }
}
