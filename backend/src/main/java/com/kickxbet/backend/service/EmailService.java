package com.kickxbet.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendOtp(String recipientEmail, String otpCode) {
        if (mailSender == null) {
            log.warn("Email sender is not configured. OTP for {} is {}", recipientEmail, otpCode);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(recipientEmail);
        message.setSubject("Kick X Bet OTP Verification");
        message.setText("Your OTP code is: " + otpCode + "\n\nIf you did not request this, please ignore this email.");

        mailSender.send(message);
        log.info("OTP email dispatched to {}", recipientEmail);
    }
}
