package com.querymole.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExecutionResponse {
    private List<String> columns;
    private List<Map<String, Object>> rows;
    private String error;
    private boolean success;
    private long executionTimeMs;

    public static ExecutionResponse success(List<String> columns, List<Map<String, Object>> rows, long executionTimeMs) {
        ExecutionResponse response = new ExecutionResponse();
        response.setColumns(columns);
        response.setRows(rows);
        response.setSuccess(true);
        response.setExecutionTimeMs(executionTimeMs);
        return response;
    }

    public static ExecutionResponse failure(String error) {
        ExecutionResponse response = new ExecutionResponse();
        response.setError(error);
        response.setSuccess(false);
        return response;
    }
}
