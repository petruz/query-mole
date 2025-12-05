package com.querymole.backend.dto;

import lombok.Data;

@Data
public class ConnectionRequest {
    private String url;
    private String username;
    private String password;
    private String name;
    private String driverClassName;

    // Decomposed fields for convenience (Frontend should use these to help backend
    // rewrite URL)
    private String host;
    private String port;
    private String database;
    private String dbType;

    // SSH Tunneling fields
    private boolean useSsh;
    private String sshHost;
    private String sshPort; // String to handle potential empty/parsing logic effectively
    private String sshUser;
    private String sshPassword;
}
