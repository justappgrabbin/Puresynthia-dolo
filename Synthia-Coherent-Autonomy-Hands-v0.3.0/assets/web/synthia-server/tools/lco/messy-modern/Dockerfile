# MESSY Modern v1.1 — Containerized Deployment
# Multi-stage build for production hardening

# Stage 1: Builder
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends     build-essential     && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim AS runtime

WORKDIR /app

# Create non-root user for security
RUN groupadd -r messy && useradd -r -g messy -s /bin/false messy

# Copy Python dependencies from builder
COPY --from=builder /root/.local /home/messy/.local
ENV PATH=/home/messy/.local/bin:$PATH

# Copy application code
COPY schema.py .
COPY morphic_schema.py .
COPY messy_backend.py .
COPY SelfModificationController.py .
COPY experimental_neural_v2.py .

# Copy frontend
COPY messy_modern.html /app/static/
COPY HybridMessyRuntime.js /app/static/
COPY AlignedMessyLifecycle.js /app/static/

# Set ownership
RUN chown -R messy:messy /app

# Switch to non-root user
USER messy

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3     CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run the application
CMD ["python", "messy_backend.py"]
