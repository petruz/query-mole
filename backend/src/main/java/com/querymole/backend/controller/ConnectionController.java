package com.querymole.backend.controller;

import com.querymole.backend.dto.ConnectionRequest;
import com.querymole.backend.dto.DriverInfo;
import com.querymole.backend.service.DriverLoaderService;
import com.querymole.backend.service.JdbcExecutorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Connection;
import java.sql.Driver;
import java.util.List;
import java.util.Map;
import java.util.Properties;

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
            jdbcExecutorService.switchConnection(
                    request.getUrl(),
                    request.getUsername(),
                    request.getPassword(),
                    request.getDriverClassName());
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
            Connection conn = null;

            // Use DriverLoaderService if custom driver is specified
            if (request.getDriverClassName() != null && !request.getDriverClassName().isEmpty()) {
                logger.debug("Using custom driver: {}", request.getDriverClassName());
                try {
                    Driver driver = driverLoaderService.getDriver(request.getDriverClassName());
                    Properties props = new Properties();
                    props.setProperty("user", request.getUsername());
                    props.setProperty("password", request.getPassword());

                    conn = driver.connect(request.getUrl(), props);
                } catch (Exception e) {
                    logger.error("Failed to load custom driver: {}", request.getDriverClassName(), e);
                    return ResponseEntity.badRequest().body(Map.of(
                            "success", false,
                            "message", "Failed to load driver: " + request.getDriverClassName(),
                            "error", e.getMessage()));
                }
            } else {
                // Fallback to DriverManager for built-in drivers
                logger.debug("Using DriverManager for connection");
                org.springframework.jdbc.datasource.DriverManagerDataSource ds = new org.springframework.jdbc.datasource.DriverManagerDataSource();
                ds.setUrl(request.getUrl());
                ds.setUsername(request.getUsername());
                ds.setPassword(request.getPassword());

                if (request.getUrl().contains("postgresql")) {
                    ds.setDriverClassName("org.postgresql.Driver");
                } else if (request.getUrl().contains("h2")) {
                    ds.setDriverClassName("org.h2.Driver");
                }

                conn = ds.getConnection();
            }

            if (conn != null && conn.isValid(5)) {
                logger.info("Connection test successful for: {}", request.getUrl());
                conn.close();
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Connection successful"));
            } else {
                logger.warn("Connection test failed - connection invalid: {}", request.getUrl());
                if (conn != null)
                    conn.close();
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Connection invalid",
                        "error", "Connection was established but is not valid"));
            }
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
