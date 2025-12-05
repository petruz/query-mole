package com.querymole.backend.service;

import com.querymole.backend.dto.ExecutionResponse;
import com.querymole.backend.util.TypeConverterRegistry;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class JdbcExecutorService {

    private JdbcTemplate jdbcTemplate;

    private final DriverLoaderService driverLoaderService;

    private final TypeConverterRegistry typeConverterRegistry;

    public JdbcExecutorService(JdbcTemplate jdbcTemplate, DriverLoaderService driverLoaderService,
            TypeConverterRegistry typeConverterRegistry) {
        this.jdbcTemplate = jdbcTemplate;
        this.driverLoaderService = driverLoaderService;
        this.typeConverterRegistry = typeConverterRegistry;
    }

    private com.jcraft.jsch.Session sshSession;

    public void switchConnection(com.querymole.backend.dto.ConnectionRequest request) {
        try {
            // Close existing SSH session if any
            if (this.sshSession != null && this.sshSession.isConnected()) {
                this.sshSession.disconnect();
            }

            String jdbcUrl = request.getUrl();

            // Handle SSH Tunneling
            if (request.isUseSsh()) {
                com.jcraft.jsch.JSch jSch = new com.jcraft.jsch.JSch();
                this.sshSession = jSch.getSession(request.getSshUser(), request.getSshHost(),
                        Integer.parseInt(request.getSshPort()));
                this.sshSession.setPassword(request.getSshPassword());
                // Avoid StrictHostKeyChecking for simplicity/demo purposes (User beware in
                // production)
                java.util.Properties config = new java.util.Properties();
                config.put("StrictHostKeyChecking", "no");
                this.sshSession.setConfig(config);
                this.sshSession.connect();

                // Parse DB port from original URL or separate field?
                // The URL is like jdbc:postgresql://host:port/db
                // We need to forward a local port to remote host:port.
                // Assuming request.getUrl() contains the REMOTE host and port.
                // WE need to parse it. Or use the separate fields if available.

                // Ideally we should reuse the parsing logic or expect specific fields.
                // BUT ConnectionRequest doesn't strictly enforce broken down fields, though the
                // frontend sends them.
                // Let's blindly assume we need to rewrite the URL.

                // Actually, JSch setPortForwardingL can accept 0 to allocate a random port.
                int assignedPort = this.sshSession.setPortForwardingL(0,
                        request.getHost() != null ? request.getHost() : "localhost",
                        Integer.parseInt(request.getPort()));

                // Rewrite URL to use localhost and assignedPort
                // Simple string replacement for now, assuming standard formats
                // This is a bit brittle but fits the MVP.
                // Better approach: Reconstruct URL from dbType logic, but valid JDBC URLs vary.
                // Strategy: Replace host:port in the URL.
                String originalHostPort = (request.getHost() != null ? request.getHost() : "localhost") + ":"
                        + request.getPort();
                jdbcUrl = jdbcUrl.replace(originalHostPort, "127.0.0.1:" + assignedPort);
            }

            javax.sql.DataSource dataSource = createDataSource(jdbcUrl, request.getUsername(), request.getPassword(),
                    request.getDriverClassName());
            this.jdbcTemplate = new JdbcTemplate(dataSource);
        } catch (Exception e) {
            throw new RuntimeException("Failed to switch connection: " + e.getMessage(), e);
        }
    }

    public void testConnection(com.querymole.backend.dto.ConnectionRequest request) throws Exception {
        com.jcraft.jsch.Session tempSshSession = null;
        try {
            String jdbcUrl = request.getUrl();
            if (request.isUseSsh()) {
                com.jcraft.jsch.JSch jSch = new com.jcraft.jsch.JSch();
                tempSshSession = jSch.getSession(request.getSshUser(), request.getSshHost(),
                        Integer.parseInt(request.getSshPort()));
                tempSshSession.setPassword(request.getSshPassword());
                java.util.Properties config = new java.util.Properties();
                config.put("StrictHostKeyChecking", "no");
                tempSshSession.setConfig(config);
                tempSshSession.connect();

                int assignedPort = tempSshSession.setPortForwardingL(0,
                        request.getHost() != null ? request.getHost() : "localhost",
                        Integer.parseInt(request.getPort()));
                String originalHostPort = (request.getHost() != null ? request.getHost() : "localhost") + ":"
                        + request.getPort();
                jdbcUrl = jdbcUrl.replace(originalHostPort, "127.0.0.1:" + assignedPort);
            }

            javax.sql.DataSource dataSource = createDataSource(jdbcUrl, request.getUsername(), request.getPassword(),
                    request.getDriverClassName());
            try (java.sql.Connection conn = dataSource.getConnection()) {
                if (!conn.isValid(5)) {
                    throw new java.sql.SQLException("Connection is valid but failed validation check.");
                }
            }

        } finally {
            if (tempSshSession != null && tempSshSession.isConnected()) {
                tempSshSession.disconnect();
            }
        }
    }

    private javax.sql.DataSource createDataSource(String url, String username, String password, String driverClassName)
            throws Exception {
        if (driverClassName != null && !driverClassName.isEmpty()) {
            // Use dynamic driver loading
            java.sql.Driver driver = driverLoaderService.getDriver(driverClassName);
            org.springframework.jdbc.datasource.SimpleDriverDataSource simpleDataSource = new org.springframework.jdbc.datasource.SimpleDriverDataSource();
            simpleDataSource.setDriver(driver);
            simpleDataSource.setUrl(url);
            simpleDataSource.setUsername(username);
            simpleDataSource.setPassword(password);
            return simpleDataSource;
        } else {
            // Fallback to default behavior (DriverManagerDataSource)
            DriverManagerDataSource defaultDataSource = new DriverManagerDataSource();
            defaultDataSource.setUrl(url);
            defaultDataSource.setUsername(username);
            defaultDataSource.setPassword(password);
            // Basic driver detection or default to Postgres for now, can be enhanced
            if (url.contains("postgresql")) {
                defaultDataSource.setDriverClassName("org.postgresql.Driver");
            } else if (url.contains("h2")) {
                defaultDataSource.setDriverClassName("org.h2.Driver");
            }
            return defaultDataSource;
        }
    }

    public ExecutionResponse executeQuery(String sql) {
        long startTime = System.currentTimeMillis();
        try {
            return jdbcTemplate.query(sql, rs -> {
                ResultSetMetaData metaData = rs.getMetaData();
                int columnCount = metaData.getColumnCount();
                List<String> columns = new ArrayList<>();
                for (int i = 1; i <= columnCount; i++) {
                    columns.add(metaData.getColumnName(i));
                }

                List<Map<String, Object>> rows = new ArrayList<>();
                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    for (String column : columns) {
                        Object value = rs.getObject(column);
                        // Convert database-specific types to JSON-serializable formats
                        Object convertedValue = typeConverterRegistry.convertToSerializable(value);
                        row.put(column, convertedValue);
                    }
                    rows.add(row);
                }
                long duration = System.currentTimeMillis() - startTime;
                return new ExecutionResponse(columns, rows, null, true, duration);
            });
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            return new ExecutionResponse(null, null, e.getMessage(), false, duration);
        }
    }
}
