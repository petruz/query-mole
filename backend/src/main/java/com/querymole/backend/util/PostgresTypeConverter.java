package com.querymole.backend.util;

import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * PostgreSQL-specific type converter.
 * Handles PostgreSQL types: intervals, arrays, JSON/JSONB, UUIDs, and byte
 * arrays.
 * Uses reflection to avoid compile-time dependencies on PostgreSQL driver
 * classes.
 */
@Component
public class PostgresTypeConverter implements DatabaseTypeConverter {

    @Override
    public boolean canHandle(Object value) {
        if (value == null) {
            return false;
        }

        String className = value.getClass().getName();
        return className.equals("org.postgresql.util.PGInterval")
                || className.equals("org.postgresql.jdbc.PgArray")
                || className.equals("org.postgresql.jdbc4.Jdbc4Array")
                || className.equals("org.postgresql.util.PGobject");
    }

    @Override
    public Object convertToSerializable(Object value) {
        if (value == null) {
            return null;
        }

        String className = value.getClass().getName();

        // Handle PostgreSQL Interval (org.postgresql.util.PGInterval)
        if (className.equals("org.postgresql.util.PGInterval")) {
            return formatInterval(value);
        }

        // Handle PostgreSQL Array (org.postgresql.jdbc.PgArray)
        if (className.equals("org.postgresql.jdbc.PgArray") || className.equals("org.postgresql.jdbc4.Jdbc4Array")) {
            try {
                return convertArray(value);
            } catch (Exception e) {
                return value.toString();
            }
        }

        // Handle PostgreSQL Objects (org.postgresql.util.PGobject - JSON, JSONB,
        // HSTORE, etc.)
        if (className.equals("org.postgresql.util.PGobject")) {
            return convertPGobject(value);
        }

        return value;
    }

    /**
     * Formats a PostgreSQL interval to a human-readable string using reflection.
     * Examples: "2 days 03:45:12", "00:00:05.123456", "1 year 2 mons 3 days"
     */
    private String formatInterval(Object interval) {
        try {
            Class<?> clazz = interval.getClass();

            int years = (int) clazz.getMethod("getYears").invoke(interval);
            int months = (int) clazz.getMethod("getMonths").invoke(interval);
            int days = (int) clazz.getMethod("getDays").invoke(interval);
            int hours = (int) clazz.getMethod("getHours").invoke(interval);
            int minutes = (int) clazz.getMethod("getMinutes").invoke(interval);
            double seconds = (double) clazz.getMethod("getSeconds").invoke(interval);

            StringBuilder sb = new StringBuilder();

            // Build human-readable format
            if (years != 0) {
                sb.append(years).append(years == 1 ? " year " : " years ");
            }
            if (months != 0) {
                sb.append(months).append(months == 1 ? " mon " : " mons ");
            }
            if (days != 0) {
                sb.append(days).append(days == 1 ? " day " : " days ");
            }

            // Always show time component if any time part is non-zero or if nothing else
            // was shown
            if (hours != 0 || minutes != 0 || seconds != 0 || sb.length() == 0) {
                sb.append(String.format("%02d:%02d:%09.6f", hours, minutes, seconds));
            }

            return sb.toString().trim();
        } catch (Exception e) {
            // Fallback to toString if reflection fails
            return interval.toString();
        }
    }

    /**
     * Converts a PostgreSQL array to a Java List using reflection.
     */
    private List<?> convertArray(Object pgArray) throws Exception {
        Method getArrayMethod = pgArray.getClass().getMethod("getArray");
        Object[] array = (Object[]) getArrayMethod.invoke(pgArray);
        return Arrays.stream(array)
                .map(item -> {
                    // Recursively convert nested arrays
                    if (canHandle(item)) {
                        return convertToSerializable(item);
                    }
                    return item;
                })
                .collect(Collectors.toList());
    }

    /**
     * Converts a PGobject (JSON, JSONB, HSTORE, etc.) to a serializable format
     * using reflection.
     */
    private Object convertPGobject(Object pgObject) {
        try {
            Class<?> clazz = pgObject.getClass();
            Method getTypeMethod = clazz.getMethod("getType");
            Method getValueMethod = clazz.getMethod("getValue");

            String type = (String) getTypeMethod.invoke(pgObject);
            String value = (String) getValueMethod.invoke(pgObject);

            // For JSON and JSONB, return the raw string
            // The frontend can parse it if needed
            if ("json".equalsIgnoreCase(type) || "jsonb".equalsIgnoreCase(type)) {
                return value;
            }

            // For other types (HSTORE, etc.), return as string
            return value;
        } catch (Exception e) {
            // Fallback to toString if reflection fails
            return pgObject.toString();
        }
    }
}
