"""Files API endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.services.file_manager import (
    AppNotFoundError,
    FileManager,
    FileManagerError,
    InvalidAppNameError,
)

router = APIRouter(prefix="/files", tags=["files"])


class FileContent(BaseModel):
    """File content response."""

    content: str
    last_modified: datetime


class PythonFileRequest(BaseModel):
    """Python file update request."""

    content: str = Field(..., min_length=0)


class YamlFileRequest(BaseModel):
    """YAML file update request."""

    config: dict = Field(default_factory=dict)


def get_file_manager() -> FileManager:
    """Dependency to get FileManager instance."""
    return FileManager()


@router.get("/{app}/python", response_model=FileContent)
async def read_python_file(
    app: str, file_manager: FileManager = Depends(get_file_manager)
) -> FileContent:
    """Read Python file for an app."""
    try:
        content = await file_manager.read_python(app)

        # Get file modification time
        import os

        python_path = file_manager._get_python_path(app)
        stat = os.stat(python_path)
        last_modified = datetime.fromtimestamp(stat.st_mtime)

        return FileContent(content=content, last_modified=last_modified)

    except AppNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except InvalidAppNameError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FileManagerError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{app}/python")
async def write_python_file(
    app: str, request: PythonFileRequest, file_manager: FileManager = Depends(get_file_manager)
) -> dict:
    """Write Python file for an app."""
    try:
        await file_manager.write_python(app, request.content)
        return {"status": "success", "message": f"Python file for '{app}' updated"}

    except AppNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except InvalidAppNameError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FileManagerError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{app}/yaml")
async def read_yaml_file(app: str, file_manager: FileManager = Depends(get_file_manager)) -> dict:
    """Read YAML configuration for an app."""
    try:
        config = await file_manager.read_yaml(app)
        return config

    except AppNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except InvalidAppNameError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FileManagerError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{app}/yaml")
async def write_yaml_file(
    app: str, request: YamlFileRequest, file_manager: FileManager = Depends(get_file_manager)
) -> dict:
    """Write YAML configuration for an app."""
    try:
        await file_manager.write_yaml(app, request.config)
        return {"status": "success", "message": f"YAML config for '{app}' updated"}

    except AppNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except InvalidAppNameError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FileManagerError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
