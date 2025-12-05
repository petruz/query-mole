package com.querymole.backend.controller;

import com.querymole.backend.dto.ConnectionRequest;
import com.querymole.backend.dto.DriverInfo;
import com.querymole.backend.service.DriverLoaderService;
import com.querymole.backend.service.JdbcExecutorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/connection")
@CrossOrigin(origins = "http://localhost:5173")
public class ConnectionController {

    private static final Logger logger = LoggerFactory.getLogger(ConnectionController.class);

    private final JdbcExecutorService jdbcExecutorService;
    private final DriverLoaderService driverLoaderService;

    public ConnectionController(JdbcExecutorService jdbcExecutorService, DriverLoaderService driverLoaderService) {
        this.jdbcExecutorService = jdbcExecutorService;
        this.driverLoaderService = driverLoaderService;
    }

    /**
     * Get list of available JDBC drivers from the drivers folder.
     */
    @GetMapping("/drivers")
    public ResponseEntity<List<DriverInfo>> getAvailableDrivers() {
        logger.info("Fetching available JDBC drivers");
        try {
            List<DriverInfo> drivers = driverLoaderService.getAvailableDrivers();
            logger.info("Found {} available drivers", drivers.size());
            return ResponseEntity.ok(drivers);
        } catch (Exception e) {
            logger.error("Error fetching available drivers", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/connect")
    public void connect(@RequestBody ConnectionRequest request) {
        logger.info("Connecting to database: {}", request.getUrl());
        try {
            jdbcExecutorService.switchConnection(request);
            logger.info("Successfully connected to database");
        } catch (Exception e) {
            logger.error("Failed to connect to database: {}", request.getUrl(), e);
            throw e;
        }
    }

    @PostMapping("/test")
    public ResponseEntity<?> test(@RequestBody ConnectionRequest request) {
        logger.info("Testing connection to: {}", request.getUrl());

        try {
            jdbcExecutorService.testConnection(request);
            logger.info("Connection test successful for: {}", request.getUrl());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Connection successful"));
        } catch (Exception e) {
            logger.error("Connection test failed for {}: {}", request.getUrl(), e.getMessage(), e);

            // Provide detailed error message
            String errorMessage = e.getMessage();
            if (errorMessage == null || errorMessage.isEmpty()) {
                errorMessage = e.getClass().getSimpleName();
            }

            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Connection test failed",
                    "error", errorMessage,
                    "errorType", e.getClass().getSimpleName()));
        }
    }
}
