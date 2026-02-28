"""Tests for VersionControl service."""

import asyncio
from datetime import datetime
from pathlib import Path

import pytest
import pytest_asyncio

from app.services.version_control import (
    VersionControl,
    VersionNotFoundError,
)


@pytest_asyncio.fixture
async def version_control(tmp_path: Path) -> VersionControl:
    """Create a VersionControl with temporary base path."""
    base_path = tmp_path / "apps"
    base_path.mkdir()
    return VersionControl(base_path=base_path)


@pytest_asyncio.fixture
async def version_control_with_app(version_control: VersionControl) -> VersionControl:
    """Create VersionControl with a test app directory."""
    app_path = version_control.base_path / "test_app"
    app_path.mkdir()
    return version_control


@pytest.mark.asyncio
async def test_create_version_success(version_control_with_app: VersionControl) -> None:
    """Test creating a new version."""
    vc = version_control_with_app

    version = await vc.create_version("test_app", "test_app.py", "print('hello')")

    # Verify version format (YYYYMMDD_HHMMSS_MMM with milliseconds)
    assert len(version) == 19
    assert version[8] == "_"
    assert version[15] == "_"

    # Verify version was created
    versions_path = vc._get_versions_path("test_app")
    version_files = list(versions_path.glob(f"{version}_*"))
    assert len(version_files) == 1


@pytest.mark.asyncio
async def test_create_version_creates_directory(version_control: VersionControl) -> None:
    """Test that create_version creates the versions directory."""
    vc = version_control
    app_path = vc.base_path / "new_app"
    app_path.mkdir()

    await vc.create_version("new_app", "new_app.py", "content")

    versions_path = vc._get_versions_path("new_app")
    assert versions_path.exists()
    assert versions_path.is_dir()


@pytest.mark.asyncio
async def test_list_versions_empty(version_control_with_app: VersionControl) -> None:
    """Test listing versions when none exist."""
    vc = version_control_with_app

    versions = await vc.list_versions("test_app")

    assert len(versions) == 0


@pytest.mark.asyncio
async def test_list_versions_multiple(version_control_with_app: VersionControl) -> None:
    """Test listing multiple versions."""
    vc = version_control_with_app

    # Create multiple versions
    await vc.create_version("test_app", "test_app.py", "version 1")
    await asyncio.sleep(0.1)  # Ensure different timestamps
    await vc.create_version("test_app", "test_app.py", "version 2")
    await asyncio.sleep(0.1)
    await vc.create_version("test_app", "test_app.py", "version 3")

    versions = await vc.list_versions("test_app")

    assert len(versions) == 3

    # Check they are sorted newest first
    for i in range(len(versions) - 1):
        assert versions[i].timestamp >= versions[i + 1].timestamp


@pytest.mark.asyncio
async def test_list_versions_returns_correct_info(version_control_with_app: VersionControl) -> None:
    """Test that list_versions returns correct information."""
    vc = version_control_with_app

    content = "test content"
    version = await vc.create_version("test_app", "test_app.py", content)

    versions = await vc.list_versions("test_app")

    assert len(versions) == 1
    info = versions[0]

    assert info.version == version
    assert info.filename == "test_app.py"
    assert info.size == len(content)
    assert isinstance(info.timestamp, datetime)


@pytest.mark.asyncio
async def test_get_version_success(version_control_with_app: VersionControl) -> None:
    """Test getting version content."""
    vc = version_control_with_app

    content = "print('test version')"
    version = await vc.create_version("test_app", "test_app.py", content)

    retrieved_content = await vc.get_version("test_app", version)

    assert retrieved_content == content


@pytest.mark.asyncio
async def test_get_version_not_found(version_control_with_app: VersionControl) -> None:
    """Test getting a version that doesn't exist."""
    vc = version_control_with_app

    with pytest.raises(VersionNotFoundError):
        await vc.get_version("test_app", "99999999_999999")


@pytest.mark.asyncio
async def test_get_version_app_not_found(version_control: VersionControl) -> None:
    """Test getting a version for non-existent app."""
    vc = version_control

    with pytest.raises(VersionNotFoundError):
        await vc.get_version("nonexistent", "20240101_000000")


@pytest.mark.asyncio
async def test_restore_version_success(version_control_with_app: VersionControl) -> None:
    """Test restoring a version."""
    vc = version_control_with_app

    content = "original content"
    version = await vc.create_version("test_app", "test_app.py", content)

    restored_content = await vc.restore_version("test_app", version)

    assert restored_content == content


@pytest.mark.asyncio
async def test_restore_version_not_found(version_control_with_app: VersionControl) -> None:
    """Test restoring a version that doesn't exist."""
    vc = version_control_with_app

    with pytest.raises(VersionNotFoundError):
        await vc.restore_version("test_app", "99999999_999999")


@pytest.mark.asyncio
async def test_delete_version_success(version_control_with_app: VersionControl) -> None:
    """Test deleting a version."""
    vc = version_control_with_app

    content = "to be deleted"
    version = await vc.create_version("test_app", "test_app.py", content)

    # Verify version exists
    versions = await vc.list_versions("test_app")
    assert len(versions) == 1

    # Delete version
    await vc.delete_version("test_app", version)

    # Verify version is deleted
    versions = await vc.list_versions("test_app")
    assert len(versions) == 0


@pytest.mark.asyncio
async def test_delete_version_not_found(version_control_with_app: VersionControl) -> None:
    """Test deleting a version that doesn't exist."""
    vc = version_control_with_app

    with pytest.raises(VersionNotFoundError):
        await vc.delete_version("test_app", "99999999_999999")


@pytest.mark.asyncio
async def test_cleanup_old_versions(version_control_with_app: VersionControl) -> None:
    """Test cleaning up old versions."""
    vc = version_control_with_app

    # Create 15 versions
    for i in range(15):
        await vc.create_version("test_app", "test_app.py", f"version {i}")
        await asyncio.sleep(0.01)  # Small delay to ensure different timestamps

    # Verify all versions exist
    versions = await vc.list_versions("test_app")
    assert len(versions) == 15

    # Cleanup to keep only 10
    await vc.cleanup_old_versions("test_app", keep=10)

    # Verify only 10 remain
    versions = await vc.list_versions("test_app")
    assert len(versions) == 10


@pytest.mark.asyncio
async def test_cleanup_old_versions_no_cleanup_needed(
    version_control_with_app: VersionControl,
) -> None:
    """Test cleanup when no versions need to be removed."""
    vc = version_control_with_app

    # Create 5 versions
    for i in range(5):
        await vc.create_version("test_app", "test_app.py", f"version {i}")
        await asyncio.sleep(0.01)

    # Cleanup with keep=10 (more than we have)
    await vc.cleanup_old_versions("test_app", keep=10)

    # Verify all versions still exist
    versions = await vc.list_versions("test_app")
    assert len(versions) == 5


@pytest.mark.asyncio
async def test_parse_version_filename(tmp_path: Path) -> None:
    """Test parsing version filename."""
    vc = VersionControl(base_path=tmp_path)
    """Test parsing version filenames."""
    vc = VersionControl(Path("/tmp"))

    # Valid filenames (with milliseconds format)
    assert vc._parse_version_filename("20240228_102300_123_test.py") == (
        "20240228_102300_123",
        "test.py",
    )
    assert vc._parse_version_filename("20240101_000000_000_app.yaml") == (
        "20240101_000000_000",
        "app.yaml",
    )

    # Invalid filenames
    assert vc._parse_version_filename("invalid") is None
    assert vc._parse_version_filename("not_a_version_file.txt") is None
    assert vc._parse_version_filename("2024_102300_123_test.py") is None


@pytest.mark.asyncio
async def test_generate_timestamp(tmp_path: Path) -> None:
    """Test timestamp generation."""
    vc = VersionControl(base_path=tmp_path)
    """Test timestamp generation."""
    vc = VersionControl(Path("/tmp"))

    timestamp = vc._generate_timestamp()

    # Verify format (YYYYMMDD_HHMMSS_MMM)
    assert len(timestamp) == 19
    assert timestamp[8] == "_"
    assert timestamp[15] == "_"

    # Verify it's a valid datetime
    dt = datetime.strptime(timestamp, "%Y%m%d_%H%M%S_%f")
    assert isinstance(dt, datetime)


@pytest.mark.asyncio
async def test_multiple_files_same_version(version_control_with_app: VersionControl) -> None:
    """Test creating versions for multiple files."""
    vc = version_control_with_app

    # Create versions for different files
    await vc.create_version("test_app", "test_app.py", "python content")
    await asyncio.sleep(0.1)
    await vc.create_version("test_app", "test_app.yaml", "yaml content")

    versions = await vc.list_versions("test_app")

    assert len(versions) == 2

    filenames = [v.filename for v in versions]
    assert "test_app.py" in filenames
    assert "test_app.yaml" in filenames
