# syntax=docker/dockerfile:1.4

# ── Stage 1: Build React frontend (architecture-independent static files) ──────
# --platform=$BUILDPLATFORM: always runs on the builder host (x86), never QEMU
FROM --platform=$BUILDPLATFORM node:20-alpine AS node-build

WORKDIR /app

COPY src/ui/package.json src/ui/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

COPY src/ui/ .
RUN npm run build
# Output: /app/dist (pure HTML/CSS/JS — no arch dependency)

# ── Stage 1b: Frontend dist ─────────────────────────────────────────────────────
# Local builds: copies dist from node-build above.
# CI builds: replaced entirely via --build-context frontend-dist=./dist
#   → node-build stage is skipped, Node is never pulled, npm never runs.
FROM scratch AS frontend-dist
COPY --from=node-build /app/dist/ /

# ── Stage 2: Build .NET backend ────────────────────────────────────────────────
# --platform=$BUILDPLATFORM: SDK runs on host, cross-compiles to TARGETARCH
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS backend

WORKDIR /src

COPY src/AppDaemonStudio/ .

# TARGETARCH injected by docker buildx: amd64 | arm64
ARG TARGETARCH
# BUILD_VERSION baked into the assembly as InformationalVersion
ARG BUILD_VERSION=unknown
RUN --mount=type=cache,target=/root/.nuget/packages \
    dotnet publish -c Release \
    -r linux-${TARGETARCH} \
    --self-contained false \
    /p:Version=${BUILD_VERSION} \
    -o /publish

# ── Stage 3: Final image ───────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine

# Re-declare ARGs so they're in scope for LABEL (global ARGs don't flow into stages)
ARG BUILD_VERSION=unknown
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="AppDaemon Studio"
LABEL org.opencontainers.image.description="Web IDE for AppDaemon apps"
LABEL org.opencontainers.image.version="${BUILD_VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"

WORKDIR /app

# Python venv with pylsp + appdaemon for LSP support
# appdaemon installed so Jedi reads real source — full API completions, hover, go-to-def
RUN apk add --no-cache python3 py3-pip py3-virtualenv && \
    python3 -m venv /opt/pylsp-venv && \
    /opt/pylsp-venv/bin/pip install --no-cache-dir \
        "python-lsp-server[pyflakes,pycodestyle]" \
        appdaemon

# .NET backend binary (arch-specific)
COPY --from=backend /publish .

# React frontend (same files for all architectures)
COPY --from=frontend-dist / ./wwwroot

ENV ASPNETCORE_URLS=http://+:3000 \
    DOTNET_RUNNING_IN_CONTAINER=true \
    PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["dotnet", "AppDaemonStudio.dll"]
