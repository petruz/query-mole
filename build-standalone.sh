#!/bin/bash

# Query Mole - Standalone Build Script
# This script builds the frontend and backend into a single executable JAR

set -e  # Exit on error

echo "🏗️  Building Query Mole Standalone JAR..."
echo ""

# Step 1: Build Frontend
echo "📦 Step 1/3: Building frontend..."
cd frontend
npm install
npm run build
cd ..
echo "✅ Frontend build complete"
echo ""

# Step 2: Copy frontend build to backend static resources
echo "📋 Step 2/3: Copying frontend to backend resources..."
rm -rf backend/src/main/resources/static
mkdir -p backend/src/main/resources/static
cp -r frontend/dist/* backend/src/main/resources/static/
echo "✅ Frontend copied to backend/src/main/resources/static/"
echo ""

# Step 3: Build backend JAR
echo "🔨 Step 3/3: Building backend JAR..."
cd backend
./gradlew clean bootJar
cd ..
echo "✅ Backend JAR built"
echo ""

# Show result
JAR_PATH="backend/build/libs/backend-0.0.1-SNAPSHOT.jar"
if [ -f "$JAR_PATH" ]; then
    JAR_SIZE=$(du -h "$JAR_PATH" | cut -f1)
    echo "🎉 Build complete!"
    echo ""
    echo "📦 Executable JAR: $JAR_PATH ($JAR_SIZE)"
    echo ""
    echo "▶️  Run with:"
    echo "   java -jar $JAR_PATH"
    echo ""
    echo "🌐 The application will be available at:"
    echo "   http://localhost:8080"
else
    echo "❌ Build failed: JAR not found at $JAR_PATH"
    exit 1
fi
