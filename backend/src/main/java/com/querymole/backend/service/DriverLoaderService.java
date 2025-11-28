package com.querymole.backend.service;

import com.querymole.backend.dto.DriverInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.net.URL;
import java.net.URLClassLoader;
import java.sql.Driver;
import java.util.ArrayList;
import java.util.List;
import java.util.jar.JarFile;
import java.util.jar.JarEntry;
import java.util.Enumeration;

@Service
public class DriverLoaderService {

    private static final Logger logger = LoggerFactory.getLogger(DriverLoaderService.class);
    private static final String DRIVERS_DIR = "drivers";

    /**
     * Get available JDBC drivers from the drivers directory.
     * Scans JAR files and attempts to detect driver classes.
     */
    public List<DriverInfo> getAvailableDrivers() {
        List<DriverInfo> drivers = new ArrayList<>();
        File driversDir = new File(DRIVERS_DIR);

        if (!driversDir.exists() || !driversDir.isDirectory()) {
            logger.warn("Drivers directory not found: {}", driversDir.getAbsolutePath());
            return drivers;
        }

        File[] jarFiles = driversDir.listFiles((dir, name) -> name.endsWith(".jar"));
        if (jarFiles == null || jarFiles.length == 0) {
            logger.info("No JAR files found in drivers directory");
            return drivers;
        }

        logger.info("Scanning {} JAR files in drivers directory", jarFiles.length);

        for (File jarFile : jarFiles) {
            try {
                logger.debug("Scanning JAR: {}", jarFile.getName());
                String driverClass = detectDriverClass(jarFile);

                if (driverClass != null) {
                    DriverInfo info = new DriverInfo();
                    info.setDriverClassName(driverClass);
                    info.setJarFileName(jarFile.getName());
                    info.setAvailable(true);

                    // Detect database type from driver class name
                    String dbType = detectDatabaseType(driverClass);
                    info.setDatabaseType(dbType);
                    info.setDisplayName(getDisplayName(dbType));

                    drivers.add(info);
                    logger.info("Detected driver: {} ({}) in {}", driverClass, dbType, jarFile.getName());
                } else {
                    logger.debug("No JDBC driver found in {}", jarFile.getName());
                }
            } catch (Exception e) {
                logger.error("Error scanning JAR file {}: {}", jarFile.getName(), e.getMessage());
            }
        }

        return drivers;
    }

    /**
     * Detect the driver class from a JAR file by looking for classes implementing
     * java.sql.Driver.
     */
    private String detectDriverClass(File jarFile) {
        try (JarFile jar = new JarFile(jarFile)) {
            Enumeration<JarEntry> entries = jar.entries();

            while (entries.hasMoreElements()) {
                JarEntry entry = entries.nextElement();
                String name = entry.getName();

                // Look for common driver class patterns
                if (name.endsWith("Driver.class") && !name.contains("$")) {
                    String className = name.replace('/', '.').replace(".class", "");

                    // Common driver class names
                    if (className.equals("org.postgresql.Driver") ||
                            className.equals("com.mysql.cj.jdbc.Driver") ||
                            className.equals("com.clickhouse.jdbc.ClickHouseDriver") ||
                            className.equals("oracle.jdbc.OracleDriver") ||
                            className.equals("org.h2.Driver") ||
                            className.contains("jdbc") && className.endsWith("Driver")) {
                        return className;
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error reading JAR file {}: {}", jarFile.getName(), e.getMessage());
        }
        return null;
    }

    /**
     * Detect database type from driver class name.
     */
    private String detectDatabaseType(String driverClassName) {
        if (driverClassName.contains("postgresql")) {
            return "postgresql";
        } else if (driverClassName.contains("mysql")) {
            return "mysql";
        } else if (driverClassName.contains("clickhouse")) {
            return "clickhouse";
        } else if (driverClassName.contains("oracle")) {
            return "oracle";
        } else if (driverClassName.contains("h2")) {
            return "h2";
        } else if (driverClassName.contains("mariadb")) {
            return "mariadb";
        } else if (driverClassName.contains("sqlserver")) {
            return "sqlserver";
        }
        return "unknown";
    }

    /**
     * Get display name for database type.
     */
    private String getDisplayName(String dbType) {
        switch (dbType) {
            case "postgresql":
                return "PostgreSQL";
            case "mysql":
                return "MySQL";
            case "clickhouse":
                return "ClickHouse";
            case "oracle":
                return "Oracle";
            case "h2":
                return "H2";
            case "mariadb":
                return "MariaDB";
            case "sqlserver":
                return "SQL Server";
            default:
                return "Unknown";
        }
    }

    public Driver getDriver(String driverClassName) throws Exception {
        logger.debug("Loading driver: {}", driverClassName);

        File driversDir = new File(DRIVERS_DIR);
        if (!driversDir.exists() || !driversDir.isDirectory()) {
            logger.error("Drivers directory not found: {}", driversDir.getAbsolutePath());
            throw new RuntimeException("Drivers directory not found: " + driversDir.getAbsolutePath());
        }

        File[] jarFiles = driversDir.listFiles((dir, name) -> name.endsWith(".jar"));
        if (jarFiles == null || jarFiles.length == 0) {
            // Try loading from classpath if no jars found or just to fallback
            logger.debug("No JAR files in drivers directory, attempting to load from classpath");
            try {
                Driver driver = (Driver) Class.forName(driverClassName).getDeclaredConstructor().newInstance();
                logger.info("Successfully loaded driver from classpath: {}", driverClassName);
                return driver;
            } catch (ClassNotFoundException e) {
                logger.error("Driver not found in classpath: {}", driverClassName);
                throw new RuntimeException(
                        "No JAR files found in drivers directory and driver not in classpath: " + driverClassName);
            }
        }

        URL[] urls = new URL[jarFiles.length];
        for (int i = 0; i < jarFiles.length; i++) {
            urls[i] = jarFiles[i].toURI().toURL();
            logger.debug("Adding JAR to classpath: {}", jarFiles[i].getName());
        }

        // Create a new URLClassLoader for the JARs with parent-first delegation
        URLClassLoader ucl = new URLClassLoader(urls, Thread.currentThread().getContextClassLoader());

        // Set the context classloader so driver and its dependencies can be found
        ClassLoader originalClassLoader = Thread.currentThread().getContextClassLoader();
        try {
            Thread.currentThread().setContextClassLoader(ucl);

            // Load the driver class - this will trigger static initialization
            Class<?> driverClass = Class.forName(driverClassName, true, ucl);

            // Try to get an instance
            Driver driver = (Driver) driverClass.getDeclaredConstructor().newInstance();

            logger.info("Successfully loaded driver: {}", driverClassName);
            return driver;
        } catch (NoClassDefFoundError e) {
            // If we get NoClassDefFoundError, the JAR might be missing dependencies
            logger.error(
                    "Driver {} is missing dependencies: {}. The JAR file may be incomplete or require additional libraries.",
                    driverClassName, e.getMessage());
            throw new RuntimeException(
                    "Driver " + driverClassName + " is missing required dependencies. " +
                            "Please ensure you have the complete JDBC driver JAR with all dependencies included. " +
                            "Missing class: " + e.getMessage(),
                    e);
        } finally {
            // Restore original context classloader
            Thread.currentThread().setContextClassLoader(originalClassLoader);
        }
    }
}
