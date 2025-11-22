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

## Usage
1. Open the application in your browser.
2. Use the **Connection** menu to create a new connection to your database (e.g., PostgreSQL).
3. Select the connection from the dropdown in the sidebar.
4. Create folders and queries in the sidebar using the `+` button or context menu.
5. Write SQL in the editor and click **Execute**.
6. Save your query library via **File > Save Library**.
