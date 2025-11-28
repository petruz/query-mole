package com.querymole.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing information about an available JDBC driver.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverInfo {
    /**
     * The fully qualified driver class name (e.g., "org.postgresql.Driver")
     */
    private String driverClassName;

    /**
     * The JAR file name containing the driver
     */
    private String jarFileName;

    /**
     * The detected database type (e.g., "postgresql", "clickhouse", "mysql")
     */
    private String databaseType;

    /**
     * Display name for the database (e.g., "PostgreSQL", "ClickHouse")
     */
    private String displayName;

    /**
     * Whether the driver is available (successfully loaded)
     */
    private boolean available;
}
