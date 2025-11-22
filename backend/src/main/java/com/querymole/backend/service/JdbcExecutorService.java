package com.querymole.backend.service;

import com.querymole.backend.dto.ExecutionResponse;
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

    public JdbcExecutorService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void switchConnection(String url, String username, String password) {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        // Basic driver detection or default to Postgres for now, can be enhanced
        if (url.contains("postgresql")) {
            dataSource.setDriverClassName("org.postgresql.Driver");
        } else if (url.contains("h2")) {
            dataSource.setDriverClassName("org.h2.Driver");
        }
        this.jdbcTemplate = new JdbcTemplate(dataSource);
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
                        row.put(column, rs.getObject(column));
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
