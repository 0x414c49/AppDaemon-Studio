"""Apps API endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.services.file_manager import (
    AppInfo,
    AppNotFoundError,
    FileManager,
    FileManagerError,
    InvalidAppNameError,
)

router = APIRouter(prefix="/apps", tags=["apps"])


class CreateAppRequest(BaseModel):
    """Request to create a new app."""

    name: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-zA-Z][a-zA-Z0-9_]*$")
    class_name: str = Field(..., min_length=1, max_length=100, pattern=r"^[A-Z][a-zA-Z0-9]*$")
    description: str = Field(default="", max_length=500)


class AppResponse(BaseModel):
    """App information response."""

    name: str
    class_name: str
    description: str
    has_python: bool
    has_yaml: bool
    last_modified: datetime
    version_count: int


class AppsListResponse(BaseModel):
    """List of apps response."""

    apps: list[AppResponse]
    count: int


def get_file_manager() -> FileManager:
    """Dependency to get FileManager instance."""
    return FileManager()


def app_info_to_response(info: AppInfo) -> AppResponse:
    """Convert AppInfo to AppResponse."""
    return AppResponse(
        name=info.name,
        class_name=info.class_name,
        description=info.description,
        has_python=info.has_python,
        has_yaml=info.has_yaml,
        last_modified=info.last_modified,
        version_count=info.version_count,
    )


@router.get("/", response_model=AppsListResponse)
async def list_apps(file_manager: FileManager = Depends(get_file_manager)) -> AppsListResponse:
    """List all apps."""
    apps = await file_manager.list_apps()
    return AppsListResponse(apps=[app_info_to_response(app) for app in apps], count=len(apps))


@router.post("/", response_model=AppResponse, status_code=status.HTTP_201_CREATED)
async def create_app(
    request: CreateAppRequest, file_manager: FileManager = Depends(get_file_manager)
) -> AppResponse:
    """Create a new app."""
    try:
        await file_manager.create_app(
            name=request.name, class_name=request.class_name, description=request.description
        )

        # Get the created app info
        apps = await file_manager.list_apps()
        app = next((a for a in apps if a.name == request.name), None)

        if not app:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create app"
            )

        return app_info_to_response(app)

    except InvalidAppNameError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FileManagerError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("/{name}", response_model=AppResponse)
async def get_app(name: str, file_manager: FileManager = Depends(get_file_manager)) -> AppResponse:
    """Get app details."""
    try:
        apps = await file_manager.list_apps()
        app = next((a for a in apps if a.name == name), None)

        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"App '{name}' not found"
            )

        return app_info_to_response(app)

    except InvalidAppNameError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_app(name: str, file_manager: FileManager = Depends(get_file_manager)) -> None:
    """Delete an app."""
    try:
        await file_manager.delete_app(name)
    except AppNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except InvalidAppNameError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
