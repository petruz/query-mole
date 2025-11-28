package com.querymole.backend.util;

import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ClickHouse-specific type converter.
 * Handles ClickHouse types: arrays, tuples, maps, IP addresses, DateTime64,
 * decimals, etc.
 * Uses reflection to avoid compile-time dependencies on ClickHouse driver
 * classes.
 */
@Component
public class ClickHouseTypeConverter implements DatabaseTypeConverter {

    @Override
    public boolean canHandle(Object value) {
        if (value == null) {
            return false;
        }

        String className = value.getClass().getName();
        return className.startsWith("com.clickhouse.data.value.ClickHouse")
                || className.startsWith("com.clickhouse.jdbc.internal.ClickHouse");
    }

    @Override
    public Object convertToSerializable(Object value) {
        if (value == null) {
            return null;
        }

        String className = value.getClass().getName();

        // Handle ClickHouse Arrays
        if (className.contains("ClickHouseArrayValue") || className.contains("Array")) {
            try {
                return convertArray(value);
            } catch (Exception e) {
                return value.toString();
            }
        }

        // Handle ClickHouse Tuples
        if (className.contains("ClickHouseTupleValue") || className.contains("Tuple")) {
            try {
                return convertTuple(value);
            } catch (Exception e) {
                return value.toString();
            }
        }

        // Handle ClickHouse Maps
        if (className.contains("ClickHouseMapValue") || className.contains("Map")) {
            try {
                return convertMap(value);
            } catch (Exception e) {
                return value.toString();
            }
        }

        // Handle ClickHouse IP addresses
        if (className.contains("ClickHouseIpv4Value") || className.contains("ClickHouseIpv6Value")) {
            return value.toString();
        }

        // Handle ClickHouse DateTime64 (high precision timestamps)
        if (className.contains("ClickHouseDateTime64Value")) {
            try {
                return formatDateTime64(value);
            } catch (Exception e) {
                return value.toString();
            }
        }

        // Handle BigDecimal (preserve precision for Decimal types)
        if (value instanceof BigDecimal) {
            return ((BigDecimal) value).toPlainString();
        }

        return value;
    }

    /**
     * Converts a ClickHouse array to a Java List using reflection.
     */
    private List<?> convertArray(Object chArray) throws Exception {
        // Try to get the array as Object[]
        Method asArrayMethod = findMethod(chArray.getClass(), "asArray", "toArray");
        if (asArrayMethod != null) {
            Object[] array = (Object[]) asArrayMethod.invoke(chArray);
            return Arrays.stream(array)
                    .map(item -> {
                        // Recursively convert nested structures
                        if (canHandle(item)) {
                            return convertToSerializable(item);
                        }
                        return item;
                    })
                    .collect(Collectors.toList());
        }

        // Fallback to toString
        return Arrays.asList(chArray.toString());
    }

    /**
     * Converts a ClickHouse tuple to a Java List using reflection.
     */
    private List<?> convertTuple(Object chTuple) throws Exception {
        // Try to get the tuple as Object[]
        Method asArrayMethod = findMethod(chTuple.getClass(), "asArray", "toArray");
        if (asArrayMethod != null) {
            Object[] array = (Object[]) asArrayMethod.invoke(chTuple);
            return Arrays.stream(array)
                    .map(item -> {
                        if (canHandle(item)) {
                            return convertToSerializable(item);
                        }
                        return item;
                    })
                    .collect(Collectors.toList());
        }

        // Fallback to toString
        return Arrays.asList(chTuple.toString());
    }

    /**
     * Converts a ClickHouse map to a Java Map using reflection.
     */
    private Map<?, ?> convertMap(Object chMap) throws Exception {
        // Try to get the map as a Java Map
        Method asMapMethod = findMethod(chMap.getClass(), "asMap", "toMap");
        if (asMapMethod != null) {
            @SuppressWarnings("unchecked")
            Map<Object, Object> map = (Map<Object, Object>) asMapMethod.invoke(chMap);
            Map<Object, Object> result = new HashMap<>();
            for (Map.Entry<Object, Object> entry : map.entrySet()) {
                Object key = entry.getKey();
                Object value = entry.getValue();

                // Convert key and value if needed
                if (canHandle(key)) {
                    key = convertToSerializable(key);
                }
                if (canHandle(value)) {
                    value = convertToSerializable(value);
                }

                result.put(key, value);
            }
            return result;
        }

        // Fallback to empty map with string representation
        Map<String, String> fallback = new HashMap<>();
        fallback.put("value", chMap.toString());
        return fallback;
    }

    /**
     * Formats a ClickHouse DateTime64 to an ISO-8601 string using reflection.
     */
    private String formatDateTime64(Object dateTime) throws Exception {
        // Try to convert to ISO string or standard format
        Method toStringMethod = dateTime.getClass().getMethod("toString");
        return (String) toStringMethod.invoke(dateTime);
    }

    /**
     * Helper method to find a method by trying multiple possible names.
     */
    private Method findMethod(Class<?> clazz, String... methodNames) {
        for (String methodName : methodNames) {
            try {
                return clazz.getMethod(methodName);
            } catch (NoSuchMethodException e) {
                // Try next method name
            }
        }
        return null;
    }
}
