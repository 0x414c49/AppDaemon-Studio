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

# Python venv with pylsp + AppDaemon for LSP support.
# AppDaemon is installed source-only so Jedi reads the real Hass API without
# pulling runtime-only deps that currently block Python 3.14 on Alpine.
# `import hassapi` works at runtime because AppDaemon adds its plugin dir to
# sys.path. Jedi only sees site-packages, so the venv includes a shim.
RUN apk add --no-cache python3 py3-pip py3-virtualenv && \
    python3 -m venv /opt/pylsp-venv && \
    /opt/pylsp-venv/bin/pip install --no-cache-dir \
        "python-lsp-server[pyflakes,pycodestyle]==1.15.0" \
        aiohttp==3.14.3 \
        aiohttp-jinja2==1.6 \
        astral==3.2 \
        bcrypt==5.0.0 \
        deepdiff==9.1.0 \
        feedparser==6.0.14 \
        iso8601==2.1.0 \
        paho-mqtt==2.1.0 \
        pid==3.0.4 \
        python-dateutil==2.9.0.post0 \
        python-socketio==5.16.4 \
        pytz==2026.3.post1 \
        pyyaml==6.0.3 \
        requests==2.34.2 \
        sockjs==0.13.0 \
        tomli==2.4.1 \
        tomli-w==1.2.0 && \
    /opt/pylsp-venv/bin/pip install --no-cache-dir --no-deps --ignore-requires-python \
        "appdaemon==4.5.13" && \
    site_packages="$(/opt/pylsp-venv/bin/python -c 'import site; print(site.getsitepackages()[0])')" && \
    printf '%s\n' \
        'class ValidationError(Exception):' \
        '    def errors(self):' \
        '        return []' \
        '' \
        '' \
        'class BaseModel:' \
        '    def __init_subclass__(cls, **kwargs):' \
        '        super().__init_subclass__()' \
        '' \
        '    def __init__(self, **kwargs):' \
        '        for key, value in kwargs.items():' \
        '            setattr(self, key, value)' \
        '' \
        '    def model_dump(self, *args, **kwargs):' \
        '        return self.__dict__.copy()' \
        '' \
        '    @classmethod' \
        '    def model_validate(cls, value, *args, **kwargs):' \
        '        return value if isinstance(value, cls) else cls(**value)' \
        '' \
        '' \
        'class RootModel(BaseModel):' \
        '    def __class_getitem__(cls, item):' \
        '        return cls' \
        '' \
        '' \
        'class SecretStr(str):' \
        '    pass' \
        '' \
        '' \
        'class SecretBytes(bytes):' \
        '    pass' \
        '' \
        '' \
        'class HttpUrl(str):' \
        '    pass' \
        '' \
        '' \
        'class ConfigDict(dict):' \
        '    pass' \
        '' \
        '' \
        'def Field(default=None, *args, **kwargs):' \
        '    return default' \
        '' \
        '' \
        'def BeforeValidator(*args, **kwargs):' \
        '    return args[0] if args else None' \
        '' \
        '' \
        'def PlainSerializer(*args, **kwargs):' \
        '    return args[0] if args else None' \
        '' \
        '' \
        'def WrapSerializer(*args, **kwargs):' \
        '    return args[0] if args else None' \
        '' \
        '' \
        'def Discriminator(*args, **kwargs):' \
        '    return args[0] if args else None' \
        '' \
        '' \
        'def Tag(*args, **kwargs):' \
        '    return args[0] if args else None' \
        '' \
        '' \
        'def field_validator(*args, **kwargs):' \
        '    def decorator(func):' \
        '        return func' \
        '' \
        '    return decorator' \
        '' \
        '' \
        'def model_validator(*args, **kwargs):' \
        '    def decorator(func):' \
        '        return func' \
        '' \
        '    return decorator' \
        '' \
        '' \
        'def field_serializer(*args, **kwargs):' \
        '    def decorator(func):' \
        '        return func' \
        '' \
        '    return decorator' \
        > "${site_packages}/pydantic.py" && \
    printf '%s\n' \
        'class PydanticUndefinedType:' \
        '    pass' \
        > "${site_packages}/pydantic_core.py" && \
    printf '%s\n' "from appdaemon.plugins.hass.hassapi import Hass" \
        > "${site_packages}/hassapi.py" && \
    /opt/pylsp-venv/bin/python -c "import appdaemon.plugins.hass.hassapi as hass; print(hass.Hass.__name__)"

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
