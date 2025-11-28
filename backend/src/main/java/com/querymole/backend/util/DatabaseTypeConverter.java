package com.querymole.backend.util;

/**
 * Interface for database-specific type converters.
 * Each database (PostgreSQL, ClickHouse, MySQL, etc.) can implement this
 * interface
 * to provide custom type conversion logic for their specific JDBC types.
 */
public interface DatabaseTypeConverter {

    /**
     * Converts a database-specific object to a JSON-serializable format.
     * 
     * @param value The value from ResultSet.getObject()
     * @return A JSON-serializable representation of the value
     */
    Object convertToSerializable(Object value);

    /**
     * Checks if this converter can handle the given value.
     * 
     * @param value The value to check
     * @return true if this converter can handle the value, false otherwise
     */
    boolean canHandle(Object value);
}
