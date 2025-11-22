package com.querymole.backend.service;

import org.springframework.stereotype.Service;

import java.io.File;
import java.net.URL;
import java.net.URLClassLoader;
import java.sql.Driver;

@Service
public class DriverLoaderService {

    private static final String DRIVERS_DIR = "drivers";

    public Driver getDriver(String driverClassName) throws Exception {
        File driversDir = new File(DRIVERS_DIR);
        if (!driversDir.exists() || !driversDir.isDirectory()) {
            throw new RuntimeException("Drivers directory not found: " + driversDir.getAbsolutePath());
        }

        File[] jarFiles = driversDir.listFiles((dir, name) -> name.endsWith(".jar"));
        if (jarFiles == null || jarFiles.length == 0) {
            // Try loading from classpath if no jars found or just to fallback
            try {
                return (Driver) Class.forName(driverClassName).getDeclaredConstructor().newInstance();
            } catch (ClassNotFoundException e) {
                throw new RuntimeException(
                        "No JAR files found in drivers directory and driver not in classpath: " + driverClassName);
            }
        }

        URL[] urls = new URL[jarFiles.length];
        for (int i = 0; i < jarFiles.length; i++) {
            urls[i] = jarFiles[i].toURI().toURL();
        }

        // Create a new URLClassLoader for the JARs
        URLClassLoader ucl = new URLClassLoader(urls, this.getClass().getClassLoader());

        // Load the driver class
        Class<?> driverClass = Class.forName(driverClassName, true, ucl);
        return (Driver) driverClass.getDeclaredConstructor().newInstance();
    }
}
