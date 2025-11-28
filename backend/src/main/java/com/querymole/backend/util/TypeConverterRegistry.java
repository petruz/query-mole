package com.querymole.backend.util;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Registry for managing database-specific type converters.
 * Automatically discovers and uses all registered DatabaseTypeConverter beans.
 * Provides a unified interface for converting database-specific types to
 * JSON-serializable formats.
 */
@Component
public class TypeConverterRegistry {

    private final List<DatabaseTypeConverter> converters;

    /**
     * Constructor that autowires all DatabaseTypeConverter beans.
     * Spring will automatically inject all implementations of
     * DatabaseTypeConverter.
     */
    public TypeConverterRegistry(List<DatabaseTypeConverter> converters) {
        this.converters = converters;
    }

    /**
     * Converts a database object to a JSON-serializable format.
     * Tries each registered converter until one can handle the value.
     * Falls back to standard type handling if no converter can handle it.
     * 
     * @param value The value from ResultSet.getObject()
     * @return A JSON-serializable representation of the value
     */
    public Object convertToSerializable(Object value) {
        if (value == null) {
            return null;
        }

        // Try each registered converter
        for (DatabaseTypeConverter converter : converters) {
            if (converter.canHandle(value)) {
                return converter.convertToSerializable(value);
            }
        }

        // Handle standard types that don't need database-specific converters
        return handleStandardTypes(value);
    }

    /**
     * Handles standard types that are common across databases.
     */
    private Object handleStandardTypes(Object value) {
        // Handle UUID
        if (value instanceof UUID) {
            return value.toString();
        }

        // Handle byte arrays (bytea, blob, etc.)
        if (value instanceof byte[]) {
            return formatByteArray((byte[]) value);
        }

        // For all other types, return as-is (primitives, strings, dates, etc.)
        // Jackson will handle these automatically
        return value;
    }

    /**
     * Formats a byte array to a hex string for display.
     */
    private String formatByteArray(byte[] bytes) {
        if (bytes.length > 100) {
            // For large byte arrays, show truncated hex
            return "\\x" + bytesToHex(java.util.Arrays.copyOf(bytes, 100)) + "... (" + bytes.length + " bytes)";
        }
        return "\\x" + bytesToHex(bytes);
    }

    /**
     * Converts bytes to hex string.
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder(2 * bytes.length);
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
