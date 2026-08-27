# ============================================================
# DriveEase — Backend Dockerfile
# Multi-stage build: Maven → JRE 17 slim
# ============================================================

# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /build

# Copy Maven wrapper and pom.xml first (caches dependencies)
COPY mvnw pom.xml ./
COPY .mvn .mvn

RUN chmod +x mvnw && ./mvnw dependency:go-offline --no-transfer-progress

# Copy source
COPY src ./src

# Build the application (skip tests — tested in CI)
RUN ./mvnw clean package -DskipTests --no-transfer-progress

# ============================================================
# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine AS runtime

WORKDIR /app

# Create non-root user for security
RUN addgroup -S driveease && adduser -S driveease -G driveease

# Copy the fat jar from builder stage
COPY --from=builder /build/target/*.jar app.jar

# Set ownership
RUN chown driveease:driveease app.jar

# Switch to non-root user
USER driveease

# Expose backend port
EXPOSE 8080

# Environment variables (set at runtime — never in Dockerfile)
ENV SPRING_PROFILES_ACTIVE=prod

# Run with explicit timezone and security settings
ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Duser.timezone=UTC", \
  "-jar", \
  "app.jar"]
