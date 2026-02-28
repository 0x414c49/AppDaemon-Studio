# Lesson 002: FastAPI Backend Development

## What I Learned

### FastAPI Structure

Organized by feature:
```
api/
├── __init__.py
├── apps.py      # App CRUD
├── files.py     # File operations
├── logs.py      # Log streaming
└── ai.py        # AI proxy
```

### Async File Operations

Use `aiofiles` for non-blocking I/O:
```python
import aiofiles

async def read_file(path: Path) -> str:
    async with aiofiles.open(path, 'r') as f:
        return await f.read()
```

### Lifespan Management

Handle startup/shutdown:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.log_watcher = LogWatcher()
    await app.state.log_watcher.start()
    yield
    # Shutdown
    await app.state.log_watcher.stop()
```

### Path Validation

Always validate paths to prevent directory traversal:
```python
from pathlib import Path

def safe_path(base: Path, filename: str) -> Path:
    path = (base / filename).resolve()
    if not str(path).startswith(str(base)):
        raise ValueError("Invalid path")
    return path
```

### Error Handling

Use custom exceptions with handlers:
```python
class AppNotFoundError(Exception):
    pass

@app.exception_handler(AppNotFoundError)
async def handle_not_found(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": str(exc)}
    )
```

## Best Practices

1. Use Pydantic models for validation
2. Return proper HTTP status codes
3. Add request/response logging
4. Use dependency injection
5. Document with docstrings

## Resources

- https://fastapi.tiangolo.com/
- https://fastapi.tiangolo.com/tutorial/background-tasks/
