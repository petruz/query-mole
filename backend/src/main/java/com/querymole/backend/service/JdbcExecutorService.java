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

    public void switchConnection(String url, String username, String password, String driverClassName) {
        try {
            javax.sql.DataSource dataSource;
            if (driverClassName != null && !driverClassName.isEmpty()) {
                // Use dynamic driver loading
                java.sql.Driver driver = driverLoaderService.getDriver(driverClassName);
                org.springframework.jdbc.datasource.SimpleDriverDataSource simpleDataSource = new org.springframework.jdbc.datasource.SimpleDriverDataSource();
                simpleDataSource.setDriver(driver);
                simpleDataSource.setUrl(url);
                simpleDataSource.setUsername(username);
                simpleDataSource.setPassword(password);
                dataSource = simpleDataSource;
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
                dataSource = defaultDataSource;
            }
            this.jdbcTemplate = new JdbcTemplate(dataSource);
        } catch (Exception e) {
            throw new RuntimeException("Failed to switch connection: " + e.getMessage(), e);
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
