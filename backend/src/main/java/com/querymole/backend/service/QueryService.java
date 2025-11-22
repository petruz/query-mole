package com.querymole.backend.service;

import com.querymole.backend.model.QueryNode;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class QueryService {

    private List<QueryNode> rootNodes = new ArrayList<>();

    @PostConstruct
    public void init() {
        // Postgres Diagnostics
        QueryNode pgFolder = new QueryNode(UUID.randomUUID().toString(), "PostgreSQL Diagnostics", "FOLDER", null);
        
        pgFolder.addChild(new QueryNode(UUID.randomUUID().toString(), "Active Connections", "QUERY", 
            "SELECT pid, usename, application_name, client_addr, state, query FROM pg_stat_activity WHERE state != 'idle'"));
            
        pgFolder.addChild(new QueryNode(UUID.randomUUID().toString(), "Blocked Queries", "QUERY", 
            "SELECT blocked_locks.pid AS blocked_pid, blocked_activity.usename AS blocked_user, blocking_locks.pid AS blocking_pid, blocking_activity.usename AS blocking_user, blocked_activity.query AS blocked_statement, blocking_activity.query AS current_statement_in_blocking_process FROM pg_catalog.pg_locks blocked_locks JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid AND blocking_locks.pid != blocked_locks.pid JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid WHERE NOT blocked_locks.granted;"));

        pgFolder.addChild(new QueryNode(UUID.randomUUID().toString(), "Long Running Queries (>1s)", "QUERY", 
            "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '1 second';"));

        // H2 Diagnostics (Keeping for reference or fallback)
        QueryNode h2Folder = new QueryNode(UUID.randomUUID().toString(), "H2 Diagnostics", "FOLDER", null);
        h2Folder.addChild(new QueryNode(UUID.randomUUID().toString(), "Sessions", "QUERY", 
            "SELECT * FROM information_schema.sessions"));

        rootNodes.add(pgFolder);
        rootNodes.add(h2Folder);
    }

    public List<QueryNode> getQueryTree() {
        return rootNodes;
    }
    
    public String getQuerySql(String queryId) {
        return findQueryById(rootNodes, queryId);
    }

    private String findQueryById(List<QueryNode> nodes, String id) {
        for (QueryNode node : nodes) {
            if (node.getId().equals(id) && "QUERY".equals(node.getType())) {
                return node.getQuery();
            }
            if (node.getChildren() != null) {
                String result = findQueryById(node.getChildren(), id);
                if (result != null) return result;
            }
        }
        return null;
    }
}
