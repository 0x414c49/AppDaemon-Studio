"""Tests for FileManager service."""

from pathlib import Path

import pytest
import pytest_asyncio

from app.services.file_manager import (
    AppNotFoundError,
    FileManager,
    FileManagerError,
    InvalidAppNameError,
    PathTraversalError,
)


@pytest_asyncio.fixture
async def file_manager(tmp_path: Path) -> FileManager:
    """Create a FileManager with temporary base path."""
    base_path = tmp_path / "apps"
    base_path.mkdir()
    return FileManager(base_path=base_path)


@pytest.mark.asyncio
async def test_create_app_success(file_manager: FileManager) -> None:
    """Test creating a new app."""
    await file_manager.create_app("test_app", "TestApp", "Test description")

    assert await file_manager.app_exists("test_app")
    assert (file_manager.base_path / "test_app").is_dir()
    assert (file_manager.base_path / "test_app" / "test_app.py").exists()
    assert (file_manager.base_path / "test_app" / "test_app.yaml").exists()


@pytest.mark.asyncio
async def test_create_app_invalid_name(file_manager: FileManager) -> None:
    """Test creating an app with invalid name."""
    with pytest.raises(InvalidAppNameError):
        await file_manager.create_app("", "TestClass", "")

    with pytest.raises(InvalidAppNameError):
        await file_manager.create_app("123_invalid", "TestClass", "")

    with pytest.raises(InvalidAppNameError):
        await file_manager.create_app("invalid-name", "TestClass", "")

    with pytest.raises(InvalidAppNameError):
        await file_manager.create_app(".hidden", "TestClass", "")


@pytest.mark.asyncio
async def test_create_app_already_exists(file_manager: FileManager) -> None:
    """Test creating an app that already exists."""
    await file_manager.create_app("existing_app", "ExistingApp", "")

    with pytest.raises(FileManagerError):
        await file_manager.create_app("existing_app", "ExistingApp", "")


@pytest.mark.asyncio
async def test_app_exists(file_manager: FileManager) -> None:
    """Test app_exists method."""
    assert not await file_manager.app_exists("nonexistent")

    await file_manager.create_app("my_app", "MyApp", "")
    assert await file_manager.app_exists("my_app")


@pytest.mark.asyncio
async def test_read_python_success(file_manager: FileManager) -> None:
    """Test reading Python file."""
    await file_manager.create_app("read_test", "ReadTest", "Test app")

    content = await file_manager.read_python("read_test")

    assert "class ReadTest" in content
    assert "Test app" in content


@pytest.mark.asyncio
async def test_read_python_not_found(file_manager: FileManager) -> None:
    """Test reading Python file that doesn't exist."""
    with pytest.raises(AppNotFoundError):
        await file_manager.read_python("nonexistent")

    # Create app without Python file
    app_path = file_manager.base_path / "no_python"
    app_path.mkdir()

    with pytest.raises(AppNotFoundError):
        await file_manager.read_python("no_python")


@pytest.mark.asyncio
async def test_write_python_success(file_manager: FileManager) -> None:
    """Test writing Python file."""
    await file_manager.create_app("write_test", "WriteTest", "")

    await file_manager.write_python("write_test", "print('hello')")

    content = await file_manager.read_python("write_test")
    assert content == "print('hello')"


@pytest.mark.asyncio
async def test_write_python_creates_backup(file_manager: FileManager) -> None:
    """Test that writing Python creates a backup."""
    await file_manager.create_app("backup_test", "BackupTest", "")

    # The initial template creates the first version
    versions = await file_manager.version_control.list_versions("backup_test")
    initial_count = len(versions)

    # Write new content - should create backup of current
    await file_manager.write_python("backup_test", "version2")

    # Check that a new version was created
    versions = await file_manager.version_control.list_versions("backup_test")
    assert len(versions) == initial_count + 1


@pytest.mark.asyncio
async def test_read_yaml_success(file_manager: FileManager) -> None:
    """Test reading YAML config."""
    await file_manager.create_app("yaml_test", "YamlTest", "")

    config = await file_manager.read_yaml("yaml_test")

    assert "yaml_test" in config
    assert config["yaml_test"]["class"] == "YamlTest"


@pytest.mark.asyncio
async def test_write_yaml_success(file_manager: FileManager) -> None:
    """Test writing YAML config."""
    await file_manager.create_app("yaml_write", "YamlWrite", "")

    new_config = {"yaml_write": {"class": "NewClass", "module": "new_module"}}
    await file_manager.write_yaml("yaml_write", new_config)

    config = await file_manager.read_yaml("yaml_write")
    assert config["yaml_write"]["class"] == "NewClass"


@pytest.mark.asyncio
async def test_list_apps(file_manager: FileManager) -> None:
    """Test listing all apps."""
    # Create some apps
    await file_manager.create_app("app1", "App1", "First app")
    await file_manager.create_app("app2", "App2", "Second app")
    await file_manager.create_app("app3", "App3", "Third app")

    apps = await file_manager.list_apps()

    assert len(apps) == 3
    app_names = [app.name for app in apps]
    assert "app1" in app_names
    assert "app2" in app_names
    assert "app3" in app_names


@pytest.mark.asyncio
async def test_list_apps_empty(file_manager: FileManager) -> None:
    """Test listing apps when none exist."""
    apps = await file_manager.list_apps()
    assert len(apps) == 0


@pytest.mark.asyncio
async def test_delete_app(file_manager: FileManager) -> None:
    """Test deleting an app."""
    await file_manager.create_app("to_delete", "ToDelete", "")
    assert await file_manager.app_exists("to_delete")

    await file_manager.delete_app("to_delete")

    assert not await file_manager.app_exists("to_delete")


@pytest.mark.asyncio
async def test_delete_app_not_found(file_manager: FileManager) -> None:
    """Test deleting a non-existent app."""
    with pytest.raises(AppNotFoundError):
        await file_manager.delete_app("nonexistent")


@pytest.mark.asyncio
async def test_path_traversal_protection(file_manager: FileManager) -> None:
    """Test that path traversal attacks are blocked."""
    # Try various path traversal attempts
    with pytest.raises((InvalidAppNameError, PathTraversalError)):
        file_manager._get_app_path("../etc/passwd")

    with pytest.raises((InvalidAppNameError, PathTraversalError)):
        file_manager._get_app_path("..\\windows\\system32")

    with pytest.raises((InvalidAppNameError, PathTraversalError)):
        file_manager._get_app_path("app/../../../etc")


@pytest.mark.asyncio
async def test_app_info_extraction(file_manager: FileManager) -> None:
    """Test that app info is correctly extracted from Python file."""
    await file_manager.create_app("info_test", "CustomClassName", "Custom description")

    apps = await file_manager.list_apps()
    app = next((a for a in apps if a.name == "info_test"), None)

    assert app is not None
    assert app.class_name == "CustomClassName"
    assert app.description == "Custom description"
    assert app.has_python is True
    assert app.has_yaml is True


@pytest.mark.asyncio
async def test_version_count(file_manager: FileManager) -> None:
    """Test that version count is tracked correctly."""
    await file_manager.create_app("version_count", "VersionCount", "")

    # Check initial version count (should be 0 since create_app doesn't create versions)
    apps = await file_manager.list_apps()
    app = next((a for a in apps if a.name == "version_count"), None)
    assert app is not None
    assert app.version_count == 0

    # Write a version - this should create 1 backup
    await file_manager.write_python("version_count", "v1")

    # Check version count increased
    apps = await file_manager.list_apps()
    app = next((a for a in apps if a.name == "version_count"), None)
    assert app is not None
    assert app.version_count >= 1  # At least 1 version created
