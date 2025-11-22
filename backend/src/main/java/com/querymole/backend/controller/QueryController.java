package com.querymole.backend.controller;

import com.querymole.backend.dto.ExecutionRequest;
import com.querymole.backend.dto.ExecutionResponse;
import com.querymole.backend.model.QueryNode;
import com.querymole.backend.service.JdbcExecutorService;
import com.querymole.backend.service.QueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allow all for dev
public class QueryController {

    @Autowired
    private QueryService queryService;

    @Autowired
    private JdbcExecutorService jdbcExecutorService;

    @GetMapping("/queries")
    public List<QueryNode> getQueries() {
        return queryService.getQueryTree();
    }

    @PostMapping("/execute")
    public ExecutionResponse execute(@RequestBody ExecutionRequest request) {
        return jdbcExecutorService.executeQuery(request.getSql());
    }
}
