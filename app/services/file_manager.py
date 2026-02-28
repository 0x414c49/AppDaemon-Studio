"""File manager service for app operations."""

import asyncio
import re
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml

from app.config import get_settings
from app.services.version_control import VersionControl


class AppInfo:
    """Information about an AppDaemon app."""

    def __init__(
        self,
        name: str,
        class_name: str,
        description: str,
        has_python: bool,
        has_yaml: bool,
        last_modified: datetime,
        version_count: int,
    ):
        self.name = name
        self.class_name = class_name
        self.description = description
        self.has_python = has_python
        self.has_yaml = has_yaml
        self.last_modified = last_modified
        self.version_count = version_count


class FileManagerError(Exception):
    """Base exception for file manager errors."""

    pass


class InvalidAppNameError(FileManagerError):
    """Raised when app name is invalid."""

    pass


class AppNotFoundError(FileManagerError):
    """Raised when app is not found."""

    pass


class PathTraversalError(FileManagerError):
    """Raised when path traversal is detected."""

    pass


class FileManager:
    """Manages AppDaemon app files."""

    def __init__(self, base_path: Path | None = None):
        """Initialize file manager.

        Args:
            base_path: Base path for apps directory. Defaults to config setting.
        """
        self.base_path = base_path or get_settings().apps_path
        self.version_control = VersionControl(self.base_path)
        self._lock = asyncio.Lock()

    def _validate_app_name(self, name: str) -> None:
        """Validate app name for security.

        Args:
            name: App name to validate.

        Raises:
            InvalidAppNameError: If name is invalid.
        """
        if not name:
            raise InvalidAppNameError("App name cannot be empty")

        if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]*$", name):
            raise InvalidAppNameError(
                "App name must start with a letter and contain only letters, numbers, and underscores"
            )

        if name.startswith(".") or name.startswith("_"):
            raise InvalidAppNameError("App name cannot start with . or _")

    def _get_app_path(self, name: str) -> Path:
        """Get validated app directory path.

        Args:
            name: App name.

        Returns:
            Path to app directory.

        Raises:
            PathTraversalError: If path traversal is detected.
        """
        self._validate_app_name(name)
        app_path = self.base_path / name

        # Prevent path traversal
        try:
            app_path.resolve().relative_to(self.base_path.resolve())
        except ValueError as e:
            raise PathTraversalError(f"Invalid path: {name}") from e

        return app_path

    def _get_python_path(self, name: str) -> Path:
        """Get Python file path for an app."""
        return self._get_app_path(name) / f"{name}.py"

    def _get_yaml_path(self, name: str) -> Path:
        """Get YAML file path for an app."""
        return self._get_app_path(name) / f"{name}.yaml"

    async def list_apps(self) -> list[AppInfo]:
        """List all apps in the apps directory.

        Returns:
            List of AppInfo objects.
        """
        apps: list[AppInfo] = []

        if not self.base_path.exists():
            return apps

        for item in self.base_path.iterdir():
            if item.is_dir() and not item.name.startswith("."):
                try:
                    app_info = await self._get_app_info(item.name)
                    apps.append(app_info)
                except (InvalidAppNameError, PathTraversalError):
                    # Skip invalid directories
                    continue

        # Sort by name
        apps.sort(key=lambda x: x.name)
        return apps

    async def _get_app_info(self, name: str) -> AppInfo:
        """Get information about a specific app.

        Args:
            name: App name.

        Returns:
            AppInfo object.
        """
        python_path = self._get_python_path(name)
        yaml_path = self._get_yaml_path(name)

        has_python = python_path.exists()
        has_yaml = yaml_path.exists()

        # Get last modified time
        last_modified = datetime.now()
        if has_python:
            stat = python_path.stat()
            last_modified = datetime.fromtimestamp(stat.st_mtime)
        elif has_yaml:
            stat = yaml_path.stat()
            last_modified = datetime.fromtimestamp(stat.st_mtime)

        # Parse class name and description from Python file
        class_name = name
        description = ""

        if has_python:
            try:
                content = await self.read_python(name)
                class_match = re.search(r"class\s+(\w+)", content)
                if class_match:
                    class_name = class_match.group(1)

                doc_match = re.search(r'"""(.+?)"""', content, re.DOTALL)
                if doc_match:
                    description = doc_match.group(1).strip().split("\n")[0]
            except Exception:
                pass

        # Get version count
        versions = await self.version_control.list_versions(name)
        version_count = len(versions)

        return AppInfo(
            name=name,
            class_name=class_name,
            description=description,
            has_python=has_python,
            has_yaml=has_yaml,
            last_modified=last_modified,
            version_count=version_count,
        )

    async def create_app(self, name: str, class_name: str, description: str = "") -> None:
        """Create a new app with template.

        Args:
            name: App name.
            class_name: Class name for the app.
            description: Optional description.

        Raises:
            InvalidAppNameError: If name is invalid.
            FileManagerError: If app already exists.
        """
        async with self._lock:
            self._validate_app_name(name)

            app_path = self._get_app_path(name)

            if app_path.exists():
                raise FileManagerError(f"App '{name}' already exists")

            # Create app directory
            app_path.mkdir(parents=True, exist_ok=False)

            # Create Python file from template
            python_content = self._render_template(name, class_name, description)
            python_path = self._get_python_path(name)

            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None, lambda: python_path.write_text(python_content, encoding="utf-8")
            )

            # Create empty YAML file
            yaml_path = self._get_yaml_path(name)
            yaml_content = self._render_yaml_template(name, class_name)

            await loop.run_in_executor(
                None, lambda: yaml_path.write_text(yaml_content, encoding="utf-8")
            )

    def _render_template(self, name: str, class_name: str, description: str) -> str:
        """Render Python app template."""
        from jinja2 import Template

        template_path = Path(__file__).parent.parent / "templates" / "empty.py.j2"
        template_content = template_path.read_text(encoding="utf-8")

        template = Template(template_content)
        return template.render(
            name=name, class_name=class_name, description=description or f"AppDaemon app: {name}"
        )

    def _render_yaml_template(self, name: str, class_name: str) -> str:
        """Render YAML configuration template."""
        config = {name: {"module": name, "class": class_name}}
        return yaml.dump(config, default_flow_style=False, sort_keys=False)

    async def read_python(self, name: str) -> str:
        """Read Python file content.

        Args:
            name: App name.

            Returns:
            Python file content.

        Raises:
            AppNotFoundError: If app doesn't exist.
        """
        app_path = self._get_app_path(name)

        if not app_path.exists():
            raise AppNotFoundError(f"App '{name}' not found")

        python_path = self._get_python_path(name)

        if not python_path.exists():
            raise AppNotFoundError(f"Python file for app '{name}' not found")

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: python_path.read_text(encoding="utf-8"))

    async def write_python(self, name: str, content: str) -> None:
        """Write Python file content with automatic backup.

        Args:
            name: App name.
            content: Python code content.

        Raises:
            AppNotFoundError: If app doesn't exist.
        """
        async with self._lock:
            app_path = self._get_app_path(name)

            if not app_path.exists():
                raise AppNotFoundError(f"App '{name}' not found")

            python_path = self._get_python_path(name)

            # Create backup of existing file
            if python_path.exists():
                existing_content = await self.read_python(name)
                await self.version_control.create_version(name, f"{name}.py", existing_content)

            # Write new content
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None, lambda: python_path.write_text(content, encoding="utf-8")
            )

            # Cleanup old versions
            await self.version_control.cleanup_old_versions(name)

    async def read_yaml(self, name: str) -> dict:
        """Read YAML configuration.

        Args:
            name: App name.

        Returns:
            YAML configuration as dictionary.

        Raises:
            AppNotFoundError: If app doesn't exist.
        """
        app_path = self._get_app_path(name)

        if not app_path.exists():
            raise AppNotFoundError(f"App '{name}' not found")

        yaml_path = self._get_yaml_path(name)

        if not yaml_path.exists():
            return {}

        loop = asyncio.get_event_loop()
        content = await loop.run_in_executor(None, lambda: yaml_path.read_text(encoding="utf-8"))

        try:
            return yaml.safe_load(content) or {}
        except yaml.YAMLError as e:
            raise FileManagerError(f"Invalid YAML: {e}") from e

    async def write_yaml(self, name: str, config: dict) -> None:
        """Write YAML configuration with automatic backup.

        Args:
            name: App name.
            config: Configuration dictionary.

        Raises:
            AppNotFoundError: If app doesn't exist.
        """
        async with self._lock:
            app_path = self._get_app_path(name)

            if not app_path.exists():
                raise AppNotFoundError(f"App '{name}' not found")

            yaml_path = self._get_yaml_path(name)

            # Create backup of existing file
            if yaml_path.exists():
                try:
                    existing_config = await self.read_yaml(name)
                    existing_content = yaml.dump(
                        existing_config, default_flow_style=False, sort_keys=False
                    )
                    await self.version_control.create_version(
                        name, f"{name}.yaml", existing_content
                    )
                except FileManagerError:
                    # If read fails, still try to write
                    pass

            # Write new content
            content = yaml.dump(config, default_flow_style=False, sort_keys=False)

            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None, lambda: yaml_path.write_text(content, encoding="utf-8")
            )

            # Cleanup old versions
            await self.version_control.cleanup_old_versions(name)

    async def delete_app(self, name: str) -> None:
        """Delete an app (moves to .trash).

        Args:
            name: App name.

        Raises:
            AppNotFoundError: If app doesn't exist.
        """
        async with self._lock:
            app_path = self._get_app_path(name)

            if not app_path.exists():
                raise AppNotFoundError(f"App '{name}' not found")

            # Move to trash instead of deleting
            trash_path = (
                self.base_path / ".trash" / f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            )
            trash_path.parent.mkdir(parents=True, exist_ok=True)

            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, lambda: app_path.rename(trash_path))

    async def app_exists(self, name: str) -> bool:
        """Check if app exists.

        Args:
            name: App name.

        Returns:
            True if app exists, False otherwise.
        """
        try:
            app_path = self._get_app_path(name)
            return app_path.exists() and app_path.is_dir()
        except (InvalidAppNameError, PathTraversalError):
            return False
