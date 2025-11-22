package com.querymole.backend.dto;

import lombok.Data;

@Data
public class ConnectionRequest {
    private String url;
    private String username;
    private String password;
    private String name;
    private String driverClassName;
}
