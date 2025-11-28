# JDBC Drivers Directory

Place your JDBC driver JAR files in this directory.

## Supported Drivers

The application will automatically detect and load any JDBC drivers placed here.

### Example Drivers:

- **PostgreSQL**: `postgresql-42.x.x.jar`
- **MySQL**: `mysql-connector-java-8.x.x.jar`
- **ClickHouse**: `clickhouse-jdbc-x.x.x-all.jar` (use the `-all` variant)
- **Oracle**: `ojdbc8.jar` or `ojdbc11.jar`
- **SQL Server**: `mssql-jdbc-x.x.x.jre11.jar`

## Download Links

- PostgreSQL: https://jdbc.postgresql.org/download/
- MySQL: https://dev.mysql.com/downloads/connector/j/
- ClickHouse: https://github.com/ClickHouse/clickhouse-java/releases
- Oracle: https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html
- SQL Server: https://docs.microsoft.com/en-us/sql/connect/jdbc/download-microsoft-jdbc-driver-for-sql-server

## Important Notes

- JAR files in this directory are **not** committed to Git (ignored by `.gitignore`)
- Use the complete/shaded JAR variants when available (e.g., `-all.jar` for ClickHouse)
- The application will scan this directory on startup and show only databases with available drivers
