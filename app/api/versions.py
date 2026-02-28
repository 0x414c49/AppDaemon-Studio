"""Versions API endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.config import get_settings
from app.services.version_control import VersionControl, VersionControlError, VersionNotFoundError

router = APIRouter(prefix="/versions", tags=["versions"])


class VersionInfoResponse(BaseModel):
    """Version information response."""

    version: str
    timestamp: datetime
    size: int
    filename: str


class VersionsListResponse(BaseModel):
    """List of versions response."""

    versions: list[VersionInfoResponse]
    count: int


class VersionContentResponse(BaseModel):
    """Version content response."""

    content: str
    version: str
    filename: str


class RestoreVersionResponse(BaseModel):
    """Restore version response."""

    status: str
    message: str
    version: str


def get_version_control() -> VersionControl:
    """Dependency to get VersionControl instance."""
    return VersionControl(get_settings().apps_path)


def version_info_to_response(info) -> VersionInfoResponse:
    """Convert VersionInfo to response model."""
    return VersionInfoResponse(
        version=info.version, timestamp=info.timestamp, size=info.size, filename=info.filename
    )


@router.get("/{app}", response_model=VersionsListResponse)
async def list_versions(
    app: str, version_control: VersionControl = Depends(get_version_control)
) -> VersionsListResponse:
    """List all versions for an app."""
    try:
        versions = await version_control.list_versions(app)
        return VersionsListResponse(
            versions=[version_info_to_response(v) for v in versions], count=len(versions)
        )
    except VersionControlError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{app}/{version}", response_model=VersionContentResponse)
async def get_version(
    app: str, version: str, version_control: VersionControl = Depends(get_version_control)
) -> VersionContentResponse:
    """Get content of a specific version."""
    try:
        content = await version_control.get_version(app, version)

        # Get version info to find filename
        versions = await version_control.list_versions(app)
        version_info = next((v for v in versions if v.version == version), None)

        if not version_info:
            raise VersionNotFoundError(f"Version '{version}' not found")

        return VersionContentResponse(
            content=content, version=version, filename=version_info.filename
        )

    except VersionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{app}/{version}/restore", response_model=RestoreVersionResponse)
async def restore_version(
    app: str, version: str, version_control: VersionControl = Depends(get_version_control)
) -> RestoreVersionResponse:
    """Restore a version."""
    try:
        await version_control.restore_version(app, version)

        return RestoreVersionResponse(
            status="success",
            message=f"Version '{version}' of app '{app}' restored successfully",
            version=version,
        )

    except VersionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{app}/{version}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_version(version: str) -> VersionResponse:
    app: str, version: str, version_control: VersionControl = Depends(get_version_control)
) -> None:
    """Delete a version."""
    try:
        await version_control.delete_version(app, version)
    except VersionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
