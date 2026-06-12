package com.kickxbet.backend.dto;

import lombok.Data;

@Data
public class OtpRequest {
    private String username;
    private String email;
    private String password;
}
