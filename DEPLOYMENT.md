# Query Mole - Deployment Guide

## Overview
Query Mole is a standalone Java application that can be deployed on Linux, macOS, and Windows platforms.

## Prerequisites
- **Java 17 or later** (JRE is sufficient)
- JDBC driver JAR files for your target databases

## Building the Application

Run the build script to create a standalone JAR:

```bash
./build-standalone.sh
```

This will:
1. Build the frontend (React/Vite)
2. Copy frontend assets to backend resources
3. Create a standalone JAR: `backend/build/libs/backend-0.0.1-SNAPSHOT.jar`

## Deployment Structure

After building, create a deployment directory with this structure:

```
query-mole/
├── backend-0.0.1-SNAPSHOT.jar    # The application JAR
├── drivers/                       # JDBC drivers directory
│   ├── postgresql-42.7.8.jar
│   ├── clickhouse-jdbc-0.9.4-all.jar
│   └── ... (other JDBC drivers)
├── start.sh                       # Linux/macOS startup script
└── start.bat                      # Windows startup script
```

## JDBC Drivers

### Important: Drivers are NOT included in the JAR

The JDBC driver JAR files are **loaded dynamically at runtime** from the `drivers` directory. This design allows you to:
- Add support for new databases without rebuilding
- Update drivers independently
- Keep the application JAR size small
- Avoid licensing issues with proprietary drivers

### Setting Up Drivers

1. Create a `drivers` directory next to the JAR file
2. Download JDBC driver JARs for your databases
3. Place them in the `drivers` directory

**Supported Drivers:**
- **PostgreSQL**: `postgresql-42.x.x.jar` - [Download](https://jdbc.postgresql.org/download/)
- **MySQL**: `mysql-connector-java-8.x.x.jar` - [Download](https://dev.mysql.com/downloads/connector/j/)
- **ClickHouse**: `clickhouse-jdbc-x.x.x-all.jar` (use `-all` variant) - [Download](https://github.com/ClickHouse/clickhouse-java/releases)
- **Oracle**: `ojdbc8.jar` or `ojdbc11.jar` - [Download](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html)
- **SQL Server**: `mssql-jdbc-x.x.x.jre11.jar` - [Download](https://docs.microsoft.com/en-us/sql/connect/jdbc/download-microsoft-jdbc-driver-for-sql-server)

> **Note**: Use complete/shaded JAR variants when available (e.g., `-all.jar` for ClickHouse)

## Running the Application

### Linux / macOS

```bash
./start.sh
```

The script will:
- Check for Java installation
- Verify the JAR file exists
- Create the `drivers` directory if missing
- List available JDBC drivers
- Start the application on port 8080

### Windows

```batch
start.bat
```

The script performs the same checks as the Linux version.

### Manual Start

If you prefer to run manually:

```bash
java -jar backend-0.0.1-SNAPSHOT.jar
```

**Custom port:**
```bash
java -jar backend-0.0.1-SNAPSHOT.jar --server.port=9090
```

## Accessing the Application

Once started, open your browser to:
```
http://localhost:8080
```

## Troubleshooting

### "Java is not installed or not in PATH"
Install Java 17 or later:
- **Ubuntu/Debian**: `sudo apt install openjdk-17-jre`
- **macOS**: `brew install openjdk@17`
- **Windows**: Download from [Adoptium](https://adoptium.net/)

### "No JDBC drivers found"
1. Ensure the `drivers` directory exists next to the JAR
2. Download appropriate JDBC driver JARs
3. Place them in the `drivers` directory
4. Restart the application

### "Driver X is missing dependencies"
Some drivers require the complete/shaded JAR variant:
- ClickHouse: Use `clickhouse-jdbc-x.x.x-all.jar` (not the regular version)
- Ensure you download the JAR with all dependencies included

### Connection Fails
1. Verify the database is accessible from your machine
2. Check the connection URL format
3. Ensure the correct driver is in the `drivers` directory
4. Check database credentials

## Configuration

### Port Configuration
Default port is 8080. Change it by:
- Editing the startup script (`PORT=8080`)
- Or passing `--server.port=XXXX` when running manually

### Driver Directory
The application looks for drivers in the `drivers` directory relative to where the JAR is executed. Ensure this directory exists in the same location as the JAR file.

## Distribution

To distribute Query Mole:

1. Build the JAR: `./build-standalone.sh`
2. Copy these files:
   - `backend/build/libs/backend-0.0.1-SNAPSHOT.jar`
   - `start.sh` (for Linux/macOS users)
   - `start.bat` (for Windows users)
3. Create a `drivers` directory
4. Optionally include common JDBC drivers
5. Package as a ZIP file

Users can then:
1. Extract the ZIP
2. Add their JDBC drivers to the `drivers` directory
3. Run the appropriate startup script
