# Task 002: Backend API Implementation

## Objective

Implement FastAPI backend with REST endpoints, WebSocket support, and simple version control.

## Requirements

### Files to Create

```
app/
├── __init__.py
├── main.py
├── config.py
├── api/
│   ├── __init__.py
│   ├── apps.py
│   ├── files.py
│   ├── logs.py
│   └── versions.py          # Version control endpoints
├── services/
│   ├── __init__.py
│   ├── file_manager.py
│   ├── log_watcher.py
│   └── version_control.py   # Simple versioning
├── templates/
│   └── empty.py.j2
└── tests/                    # Unit tests
    ├── __init__.py
    ├── test_file_manager.py
    ├── test_version_control.py
    └── conftest.py
```

### API Endpoints

#### Apps API (`/api/apps`)
- `GET /` - List all apps (scan /addon_configs/*_appdaemon/apps/)
- `POST /` - Create new empty app
  ```json
  {
    "name": "my_app",
    "class_name": "MyApp",
    "description": "My automation app"
  }
  ```
- `GET /{name}` - Get app details
- `DELETE /{name}` - Delete app (moves to .trash/)

#### Files API (`/api/files`)
- `GET /{app}/python` - Read Python file
- `PUT /{app}/python` - Write Python file (auto-creates backup)
- `GET /{app}/yaml` - Read YAML config
- `PUT /{app}/yaml` - Write YAML config (auto-creates backup)

#### Versions API (`/api/versions`)
- `GET /{app}` - List all versions for an app
  ```json
  {
    "versions": [
      {"version": "20240228_102300", "timestamp": "2024-02-28T10:23:00Z", "size": 1234},
      {"version": "20240228_101500", "timestamp": "2024-02-28T10:15:00Z", "size": 1200}
    ]
  }
  ```
- `GET /{app}/{version}` - Get specific version content
- `POST /{app}/{version}/restore` - Restore version
- `DELETE /{app}/{version}` - Delete old version

#### Logs API (`/api/logs`)
- `GET /` - Get recent logs from appdaemon.log
- `WS /ws/logs` - WebSocket for real-time streaming

### Services

#### FileManager
```python
class FileManager:
    base_path: Path  # /addon_configs/*_appdaemon/apps
    
    async def list_apps() -> List[AppInfo]
    async def create_app(name: str, class_name: str, description: str) -> None
    async def read_python(app: str) -> str
    async def write_python(app: str, content: str) -> None
    async def read_yaml(app: str) -> dict
    async def write_yaml(app: str, config: dict) -> None
    async def delete_app(app: str) -> None
    async def app_exists(app: str) -> bool
```

#### VersionControl
```python
class VersionControl:
    """Simple version control per app.
    
    Each app gets a .versions/ folder with timestamped backups.
    Format: {app_name}/.versions/{timestamp}_{filename}
    Example: my_app/.versions/20240228_102300_my_app.py
    """
    
    async def create_version(app: str, filename: str, content: str) -> str
    async def list_versions(app: str) -> List[VersionInfo]
    async def get_version(app: str, version: str) -> str
    async def restore_version(app: str, version: str) -> None
    async def delete_version(app: str, version: str) -> None
    async def cleanup_old_versions(app: str, keep: int = 10) -> None
```

#### LogWatcher
```python
class LogWatcher:
    log_path: Path  # /addon_configs/*_appdaemon/logs/appdaemon.log
    subscribers: Set[WebSocket]
    
    async def start() -> None
    async def stop() -> None
    async def subscribe(websocket: WebSocket) -> None
    async def broadcast(message: str) -> None
```

### Data Models

```python
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List

class AppInfo(BaseModel):
    name: str
    class_name: str
    description: str
    has_python: bool
    has_yaml: bool
    last_modified: datetime
    version_count: int  # Number of saved versions

class CreateAppRequest(BaseModel):
    name: str
    class_name: str
    description: str = ""

class VersionInfo(BaseModel):
    version: str  # timestamp format: YYYYMMDD_HHMMSS
    timestamp: datetime
    size: int
    filename: str

class FileContent(BaseModel):
    content: str
    last_modified: datetime
```

### Tests

Create comprehensive tests:

#### test_file_manager.py
```python
import pytest
from pathlib import Path
from services.file_manager import FileManager

@pytest.fixture
async def file_manager(tmp_path):
    return FileManager(base_path=tmp_path)

@pytest.mark.asyncio
async def test_create_app(file_manager):
    await file_manager.create_app("test_app", "TestApp", "Test description")
    assert await file_manager.app_exists("test_app")
    
@pytest.mark.asyncio
async def test_write_and_read_python(file_manager):
    await file_manager.create_app("test_app", "TestApp", "")
    await file_manager.write_python("test_app", "print('hello')")
    content = await file_manager.read_python("test_app")
    assert content == "print('hello')"

@pytest.mark.asyncio
async def test_list_apps(file_manager):
    await file_manager.create_app("app1", "App1", "")
    await file_manager.create_app("app2", "App2", "")
    apps = await file_manager.list_apps()
    assert len(apps) == 2
```

#### test_version_control.py
```python
import pytest
from services.version_control import VersionControl

@pytest.fixture
async def version_control(tmp_path):
    return VersionControl(base_path=tmp_path)

@pytest.mark.asyncio
async def test_create_version(version_control):
    version = await version_control.create_version(
        "test_app", "test_app.py", "print('v1')"
    )
    assert version.startswith("20")  # timestamp format
    
@pytest.mark.asyncio
async def test_list_versions(version_control):
    await version_control.create_version("test_app", "test_app.py", "v1")
    await version_control.create_version("test_app", "test_app.py", "v2")
    versions = await version_control.list_versions("test_app")
    assert len(versions) == 2

@pytest.mark.asyncio
async def test_restore_version(version_control):
    await version_control.create_version("test_app", "test_app.py", "original")
    version = await version_control.list_versions("test_app")[0].version
    content = await version_control.get_version("test_app", version)
    assert content == "original"
```

## Acceptance Criteria

- [ ] All endpoints implemented with proper validation
- [ ] File operations work with `/addon_configs/*_appdaemon/apps/` path
- [ ] Version control creates timestamped backups on every save
- [ ] WebSocket streams logs correctly with auto-reconnect
- [ ] All services have unit tests (80%+ coverage)
- [ ] Error handling with proper HTTP status codes
- [ ] Path validation prevents directory traversal attacks
- [ ] YAML parsing errors handled gracefully
- [ ] Can create empty app from template
- [ ] List, restore, delete versions works

## Notes

- AppDaemon config path: `/addon_configs/*_appdaemon/` (wildcard for addon slug)
- Auto-create backup on every PUT to /api/files/{app}/python or yaml
- Keep last 10 versions by default, auto-cleanup old ones
- Use async/await for all I/O operations
- WebSocket should handle disconnects gracefully
- Empty template only - no complex templates

## Time Estimate

6-8 hours (including tests)
