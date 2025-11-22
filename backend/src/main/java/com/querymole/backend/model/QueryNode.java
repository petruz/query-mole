package com.querymole.backend.model;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class QueryNode {
    private String id;
    private String name;
    private String type; // "FOLDER" or "QUERY"
    private String query; // Null if folder
    private List<QueryNode> children;

    public QueryNode(String id, String name, String type, String query) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.query = query;
        this.children = new ArrayList<>();
    }
    
    public void addChild(QueryNode child) {
        this.children.add(child);
    }
}
