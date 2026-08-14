# syntax=docker/dockerfile:1.4

# ── Stage 1: Build React frontend (architecture-independent static files) ──────
# --platform=$BUILDPLATFORM: always runs on the builder host (x86), never QEMU
FROM --platform=$BUILDPLATFORM node:22-alpine AS node-build

WORKDIR /app

COPY src/ui/package.json src/ui/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

COPY src/ui/ .
RUN npm run build
# Output: /app/dist (pure HTML/CSS/JS — no arch dependency)

# ── Stage 1b: Local frontend dist ────────────────────────────────────────────────
# Local builds: copies dist from node-build above.
# CI builds select the `ci` target and use the external context passed via
# --build-context frontend-dist=./dist.
FROM scratch AS local-frontend-dist
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

# ── Stage 2b: Python LSP venv ─────────────────────────────────────────────────
# AppDaemon 4.5.13 supports Python <3.14, while the latest Alpine Python can be
# newer. Keep the editor LSP on Python 3.13 and copy it into the final image.
# `import hassapi` works at runtime because AppDaemon adds its plugin dir to
# sys.path. Jedi only sees site-packages, so the venv includes a shim.
FROM python:3.13-alpine AS pylsp

RUN apk add --no-cache --virtual .pylsp-build-deps build-base cargo python3-dev && \
    python -m venv /opt/pylsp-venv && \
    /opt/pylsp-venv/bin/pip install --no-cache-dir \
        "python-lsp-server[pyflakes,pycodestyle]==1.15.0" \
        "appdaemon==4.5.13" && \
    apk del .pylsp-build-deps && \
    site_packages="$(/opt/pylsp-venv/bin/python -c 'import site; print(site.getsitepackages()[0])')" && \
    printf '%s\n' "from appdaemon.plugins.hass.hassapi import Hass" \
        > "${site_packages}/hassapi.py" && \
    /opt/pylsp-venv/bin/python -c "import appdaemon.plugins.hass.hassapi as hass; print(hass.Hass.__name__)"

# ── Stage 3: Final image ───────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime-base

# Re-declare ARGs so they're in scope for LABEL (global ARGs don't flow into stages)
ARG BUILD_VERSION=unknown
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="AppDaemon Studio"
LABEL org.opencontainers.image.description="Web IDE for AppDaemon apps"
LABEL org.opencontainers.image.version="${BUILD_VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"

WORKDIR /app

# Python runtime and venv with pylsp + AppDaemon for LSP support.
COPY --from=pylsp /usr/local /usr/local
COPY --from=pylsp /opt/pylsp-venv /opt/pylsp-venv

# .NET backend binary (arch-specific)
COPY --from=backend /publish .

ENV ASPNETCORE_URLS=http://+:3000 \
    DOTNET_RUNNING_IN_CONTAINER=true \
    PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["dotnet", "AppDaemonStudio.dll"]

# CI builds inject the already-built frontend as a BuildKit context named
# frontend-dist, so node-build/local-frontend-dist are skipped entirely.
FROM runtime-base AS ci
COPY --from=frontend-dist / ./wwwroot

# Local builds default to the Docker-built frontend.
FROM runtime-base AS final
COPY --from=local-frontend-dist / ./wwwroot
