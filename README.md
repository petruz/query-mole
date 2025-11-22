# Query Mole

Query Mole is a database diagnostic tool designed for developers and DBAs to execute raw SQL queries, analyze performance, and manage query libraries.

## Features
- **Raw SQL Execution**: Execute arbitrary SQL queries directly against your database.
- **Query Library**: Organize queries in a hierarchical tree (folders/files). Save and load libraries as JSON.
- **Connection Management**: Manage multiple database connections, switch between them dynamically, and save/load connection configurations.
- **Visual Results**: Dynamic results table with sorting and pagination.
- **Performance Metrics**: View execution time and row counts.

## Tech Stack
- **Backend**: Java Spring Boot (JDBC)
- **Frontend**: React (Vite, Tailwind CSS)

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+

### Running the Backend
Navigate to the `backend` directory and run:
```bash
cd backend
./gradlew clean bootRun
```
The backend will start on `http://localhost:8080`.

### Running the Frontend
Navigate to the `frontend` directory and run:
```bash
cd frontend
npm install  # Only first time
npm run dev
```
The frontend will start on `http://localhost:5173`.

## CI/CD

[![CI Pipeline](https://github.com/petruz/query-mole/actions/workflows/ci.yml/badge.svg)](https://github.com/petruz/query-mole/actions/workflows/ci.yml)

This project uses GitHub Actions for continuous integration. Every push and pull request triggers:
- **Backend**: Gradle build and tests
- **Frontend**: Vite build and linting


## Usage
1. Open the application in your browser.
2. Use the **Connection** menu to create a new connection to your database (e.g., PostgreSQL).
3. Select the connection from the dropdown in the sidebar.
4. Create folders and queries in the sidebar using the `+` button or context menu.
5. Write SQL in the editor and click **Execute**.
6. Save your query library via **File > Save Library**.

## Troubleshooting

### Port 8080 Already in Use
If the backend fails to start with the error "Port 8080 was already in use", you have two options:

**Option 1: Kill the existing process**
```bash
# Find the process using port 8080
lsof -t -i:8080 | xargs kill -9
```

**Option 2: Change the port**
Edit `backend/src/main/resources/application.properties` and add:
```properties
server.port=8081
```
Then update the frontend proxy in `frontend/vite.config.js` to match the new port.

## Adding Custom JDBC Drivers
Query Mole supports any JDBC-compliant database without recompilation:

1. Download the JDBC driver JAR for your database (e.g., MySQL, Oracle, ClickHouse, MongoDB).
2. Place the JAR file in the `backend/drivers/` directory.
3. When creating a new connection, fill in the **Driver Class Name** field (e.g., `com.mysql.cj.jdbc.Driver`).
4. For PostgreSQL and H2, the driver class name is optional (auto-detected).

