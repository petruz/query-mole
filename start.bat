@echo off
REM Query Mole - Windows Startup Script
REM This script runs the Query Mole application

setlocal enabledelayedexpansion

REM Configuration
set JAR_FILE=backend-0.0.1-SNAPSHOT.jar
set DRIVERS_DIR=drivers
set PORT=8080

echo.
echo [94m================================[0m
echo [94m  Query Mole - Starting Application[0m
echo [94m================================[0m
echo.

REM Check if JAR file exists
if not exist "%JAR_FILE%" (
    echo [91mError: JAR file not found: %JAR_FILE%[0m
    echo.
    echo Please ensure you have built the application first:
    echo   build-standalone.sh  [on Linux/macOS]
    echo.
    echo Or place the JAR file in the same directory as this script.
    echo.
    pause
    exit /b 1
)

REM Check if drivers directory exists
if not exist "%DRIVERS_DIR%" (
    echo [93mWarning: Drivers directory not found: %DRIVERS_DIR%[0m
    echo Creating drivers directory...
    mkdir "%DRIVERS_DIR%"
    echo.
    echo Please add your JDBC driver JAR files to the '%DRIVERS_DIR%' directory.
    echo See %DRIVERS_DIR%\README.md for more information.
    echo.
)

REM Check for Java
where java >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [91mError: Java is not installed or not in PATH[0m
    echo.
    echo Please install Java 17 or later:
    echo   - Download from: https://adoptium.net/
    echo   - Or use: winget install EclipseAdoptium.Temurin.17.JRE
    echo.
    pause
    exit /b 1
)

REM Get Java version
for /f "tokens=3" %%g in ('java -version 2^>^&1 ^| findstr /i "version"') do (
    set JAVA_VERSION_STRING=%%g
)
set JAVA_VERSION_STRING=%JAVA_VERSION_STRING:"=%
for /f "delims=. tokens=1" %%v in ("%JAVA_VERSION_STRING%") do set JAVA_MAJOR_VERSION=%%v

echo [92mJava found:[0m
java -version 2>&1 | findstr /i "version"

REM Check Java version (minimum 17)
if %JAVA_MAJOR_VERSION% LSS 17 (
    echo [93mWarning: Java 17 or later is recommended. You have Java %JAVA_MAJOR_VERSION%[0m
)

echo.
echo [94mJAR file:[0m %JAR_FILE%
echo [94mDrivers directory:[0m %DRIVERS_DIR%
echo [94mPort:[0m %PORT%
echo.

REM Count drivers
set DRIVER_COUNT=0
for %%f in ("%DRIVERS_DIR%\*.jar") do (
    set /a DRIVER_COUNT+=1
)

if %DRIVER_COUNT% gtr 0 (
    echo [92mFound %DRIVER_COUNT% JDBC driver^(s^) in %DRIVERS_DIR%:[0m
    for %%f in ("%DRIVERS_DIR%\*.jar") do (
        echo   - %%~nxf
    )
) else (
    echo [93mNo JDBC drivers found in %DRIVERS_DIR%[0m
    echo   The application will start but you won't be able to connect to databases.
)

echo.
echo [92mStarting Query Mole...[0m
echo.
echo The application will be available at:
echo   [94mhttp://localhost:%PORT%[0m
echo.
echo Press Ctrl+C to stop the application.
echo.
echo ----------------------------------------
echo.

REM Run the application
java -jar "%JAR_FILE%" --server.port=%PORT%

REM If the application exits, pause so user can see any error messages
if %ERRORLEVEL% neq 0 (
    echo.
    echo [91mApplication exited with error code: %ERRORLEVEL%[0m
    echo.
    pause
)
