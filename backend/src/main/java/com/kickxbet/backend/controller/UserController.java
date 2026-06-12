package com.kickxbet.backend.controller;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.kickxbet.backend.dto.LoginRequest;
import com.kickxbet.backend.dto.OtpRequest;
import com.kickxbet.backend.dto.OtpVerificationRequest;
import com.kickxbet.backend.model.Role;
import com.kickxbet.backend.model.User;
import com.kickxbet.backend.repository.UserRepository;
import com.kickxbet.backend.service.EmailService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping("/send-otp")
    @Transactional
    public Map<String, String> sendOtp(@RequestBody OtpRequest otpRequest) {
        if (otpRequest.getUsername() == null || otpRequest.getUsername().isBlank()
                || otpRequest.getEmail() == null || otpRequest.getEmail().isBlank()
                || otpRequest.getPassword() == null || otpRequest.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username, email, and password are required.");
        }

        userRepository.findByUsername(otpRequest.getUsername())
                .ifPresent(user -> {
                    if (!user.getEmail().equalsIgnoreCase(otpRequest.getEmail())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "Username already exists with a different email.");
                    }
                    if (!user.getPassword().equals(otpRequest.getPassword())) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                                "Password does not match existing user.");
                    }
                });

        if (userRepository.existsByEmail(otpRequest.getEmail())
                && userRepository.findByEmail(otpRequest.getEmail())
                        .map(user -> !user.getUsername().equals(otpRequest.getUsername())).orElse(false)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Email is already registered with another username.");
        }

        User user = userRepository.findByUsername(otpRequest.getUsername()).orElseGet(() -> {
            User newUser = new User();
            newUser.setUsername(otpRequest.getUsername());
            newUser.setEmail(otpRequest.getEmail());
            newUser.setPassword(otpRequest.getPassword());
            newUser.setBalance(500.00);
            newUser.setRole(Role.USER);
            return newUser;
        });

        String otpCode = String.format("%06d", (int) (Math.random() * 900000) + 100000);
        user.setEmailVerified(false);
        user.setVerificationCode(otpCode);
        user.setVerificationCodeExpiry(Instant.now().plus(15, ChronoUnit.MINUTES));
        userRepository.save(user);

        emailService.sendOtp(user.getEmail(), otpCode);

        Map<String, String> response = new HashMap<>();
        response.put("message", "OTP has been sent to " + user.getEmail());
        return response;
    }

    @PostMapping("/verify-otp")
    @Transactional
    public Map<String, String> verifyOtp(@RequestBody OtpVerificationRequest verificationRequest) {
        if (verificationRequest.getUsername() == null || verificationRequest.getUsername().isBlank()
                || verificationRequest.getCode() == null || verificationRequest.getCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and code are required.");
        }

        User user = userRepository.findByUsername(verificationRequest.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        if (user.getVerificationCode() == null || user.getVerificationCodeExpiry() == null
                || Instant.now().isAfter(user.getVerificationCodeExpiry())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP has expired. Please request a new code.");
        }

        if (!user.getVerificationCode().equals(verificationRequest.getCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP code.");
        }

        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Email verified successfully.");
        return response;
    }

    @PostMapping("/login")
    @Transactional
    public User login(@RequestBody LoginRequest loginRequest) {
        if (loginRequest.getUsername() == null || loginRequest.getUsername().isBlank()
                || loginRequest.getPassword() == null || loginRequest.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and password are required.");
        }

        User existingUser = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "User not found. Please register first."));

        if (!existingUser.getPassword().equals(loginRequest.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials.");
        }

        // Allow existing users to login immediately once username/password match.
        return existingUser;
    }

    @GetMapping("/{username}")
    public User getUser(@PathVariable String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }

    @PostMapping("/{username}/deposit")
    @Transactional
    public User deposit(@PathVariable String username, @RequestBody Map<String, Double> payload) {
        double amount = payload.getOrDefault("amount", 0.0);
        if (amount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deposit amount must be positive.");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        user.setBalance(user.getBalance() + amount);
        return userRepository.save(user);
    }
}
