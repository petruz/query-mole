#!/bin/bash

# Query Mole - Linux/macOS Startup Script
# This script runs the Query Mole application

set -e  # Exit on error

# Configuration
JAR_FILE="backend-0.0.1-SNAPSHOT.jar"
DRIVERS_DIR="drivers"
PORT=8080

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Query Mole - Starting Application${NC}"
echo ""

# Check if JAR file exists
if [ ! -f "$JAR_FILE" ]; then
    echo -e "${RED}❌ Error: JAR file not found: $JAR_FILE${NC}"
    echo ""
    echo "Please ensure you have built the application first:"
    echo "  ./build-standalone.sh"
    echo ""
    echo "Or place the JAR file in the same directory as this script."
    exit 1
fi

# Check if drivers directory exists
if [ ! -d "$DRIVERS_DIR" ]; then
    echo -e "${YELLOW}⚠️  Warning: Drivers directory not found: $DRIVERS_DIR${NC}"
    echo "Creating drivers directory..."
    mkdir -p "$DRIVERS_DIR"
    echo ""
    echo "Please add your JDBC driver JAR files to the '$DRIVERS_DIR' directory."
    echo "See $DRIVERS_DIR/README.md for more information."
    echo ""
fi

# Check for Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Error: Java is not installed or not in PATH${NC}"
    echo ""
    echo "Please install Java 17 or later:"
    echo "  - Ubuntu/Debian: sudo apt install openjdk-17-jre"
    echo "  - macOS: brew install openjdk@17"
    echo "  - Or download from: https://adoptium.net/"
    exit 1
fi

# Get Java version
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
echo -e "${GREEN}✓${NC} Java version: $(java -version 2>&1 | head -n 1)"

# Check Java version (minimum 17)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo -e "${YELLOW}⚠️  Warning: Java 17 or later is recommended. You have Java $JAVA_VERSION${NC}"
fi

echo ""
echo -e "${BLUE}📦 JAR file: $JAR_FILE${NC}"
echo -e "${BLUE}📁 Drivers directory: $DRIVERS_DIR${NC}"
echo -e "${BLUE}🌐 Port: $PORT${NC}"
echo ""

# Count drivers
DRIVER_COUNT=$(find "$DRIVERS_DIR" -name "*.jar" 2>/dev/null | wc -l | tr -d ' ')
if [ "$DRIVER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Found $DRIVER_COUNT JDBC driver(s) in $DRIVERS_DIR"
    find "$DRIVERS_DIR" -name "*.jar" -exec basename {} \; | sed 's/^/  - /'
else
    echo -e "${YELLOW}⚠️  No JDBC drivers found in $DRIVERS_DIR${NC}"
    echo "  The application will start but you won't be able to connect to databases."
fi

echo ""
echo -e "${GREEN}🚀 Starting Query Mole...${NC}"
echo ""
echo "The application will be available at:"
echo -e "  ${BLUE}http://localhost:$PORT${NC}"
echo ""
echo "Press Ctrl+C to stop the application."
echo ""
echo "----------------------------------------"
echo ""

# Run the application
java -jar "$JAR_FILE" --server.port=$PORT
