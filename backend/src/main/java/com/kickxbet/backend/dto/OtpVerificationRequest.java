package com.kickxbet.backend.dto;

import lombok.Data;

@Data
public class OtpVerificationRequest {
    private String username;
    private String code;
}
