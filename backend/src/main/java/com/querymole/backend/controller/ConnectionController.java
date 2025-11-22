package com.querymole.backend.controller;

import com.querymole.backend.dto.ConnectionRequest;
import com.querymole.backend.service.JdbcExecutorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/connection")
@CrossOrigin(origins = "http://localhost:5173")
public class ConnectionController {

    private final JdbcExecutorService jdbcExecutorService;

    public ConnectionController(JdbcExecutorService jdbcExecutorService) {
        this.jdbcExecutorService = jdbcExecutorService;
    }

    @PostMapping("/connect")
    public void connect(@RequestBody ConnectionRequest request) {
        jdbcExecutorService.switchConnection(request.getUrl(), request.getUsername(), request.getPassword(),
                request.getDriverClassName());
    }

    @PostMapping("/test")
    public ResponseEntity<?> test(@RequestBody ConnectionRequest request) {
        // For now, test is same as connect but maybe we revert?
        // Or we just try to connect and if it works we are good.
        // Ideally we should create a temporary datasource, test it, and close it.
        // But for simplicity, let's just use the switch logic for now or implement a
        // separate test method later.
        // Let's implement a simple test logic here.
        try {
            org.springframework.jdbc.datasource.DriverManagerDataSource ds = new org.springframework.jdbc.datasource.DriverManagerDataSource();
            ds.setUrl(request.getUrl());
            ds.setUsername(request.getUsername());
            ds.setPassword(request.getPassword());
            if (request.getUrl().contains("postgresql"))
                ds.setDriverClassName("org.postgresql.Driver");
            else if (request.getUrl().contains("h2"))
                ds.setDriverClassName("org.h2.Driver");

            try (java.sql.Connection conn = ds.getConnection()) {
                if (conn.isValid(5)) {
                    return ResponseEntity.ok(Map.of("success", true, "message", "Connection successful"));
                } else {
                    return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Connection invalid"));
                }
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
