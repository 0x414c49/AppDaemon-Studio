"""Simple version control for AppDaemon apps."""

import asyncio
import re
from datetime import datetime
from pathlib import Path
from typing import NamedTuple


class VersionInfo(NamedTuple):
    """Information about a version."""

    version: str
    timestamp: datetime
    size: int
    filename: str


class VersionControlError(Exception):
    """Base exception for version control errors."""

    pass


class VersionNotFoundError(VersionControlError):
    """Raised when version is not found."""

    pass


class VersionControl:
    """Simple version control per app.

    Each app gets a .versions/ folder with timestamped backups.
    Format: {app_name}/.versions/{timestamp}_{filename}
    Example: my_app/.versions/20240228_102300_my_app.py
    """

    def __init__(self, base_path: Path):
        """Initialize version control.

        Args:
            base_path: Base path for apps directory.
        """
        self.base_path = base_path
        self._lock = asyncio.Lock()

    def _get_versions_path(self, app: str) -> Path:
        """Get versions directory path for an app.

        Args:
            app: App name.

        Returns:
            Path to versions directory.
        """
        return self.base_path / app / ".versions"

    def _generate_timestamp(self) -> str:
        """Generate timestamp string.

        Returns:
            Timestamp in format YYYYMMDD_HHMMSS_MMM (with milliseconds).
        """
        now = datetime.now()
        return now.strftime("%Y%m%d_%H%M%S_") + f"{now.microsecond // 1000:03d}"

    def _parse_version_filename(self, filename: str) -> tuple | None:
        """Parse version filename to extract timestamp and original filename.

        Args:
            filename: Version filename.

        Returns:
            Tuple of (timestamp, original_filename) or None if invalid.
        """
        match = re.match(r"^(\d{8}_\d{6}_\d{3})_(.+)$", filename)
        if match:
            return match.group(1), match.group(2)
        return None

    async def create_version(self, app: str, filename: str, content: str) -> str:
        """Create a new version.

        Args:
            app: App name.
            filename: Original filename.
            content: File content.

        Returns:
            Version identifier (timestamp).

        Raises:
            VersionControlError: If version creation fails.
        """
        async with self._lock:
            timestamp = self._generate_timestamp()
            version_filename = f"{timestamp}_{filename}"

            versions_path = self._get_versions_path(app)
            versions_path.mkdir(parents=True, exist_ok=True)

            version_path = versions_path / version_filename

            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None, lambda: version_path.write_text(content, encoding="utf-8")
            )

            return timestamp

    async def list_versions(self, app: str) -> list[VersionInfo]:
        """List all versions for an app.

        Args:
            app: App name.

        Returns:
            List of VersionInfo objects, sorted by timestamp (newest first).
        """
        versions_path = self._get_versions_path(app)

        if not versions_path.exists():
            return []

        versions = []

        loop = asyncio.get_event_loop()

        def scan_versions():
            for item in versions_path.iterdir():
                if item.is_file():
                    parsed = self._parse_version_filename(item.name)
                    if parsed:
                        timestamp_str, filename = parsed
                        try:
                            timestamp = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S_%f")
                            stat = item.stat()
                            versions.append(
                                VersionInfo(
                                    version=timestamp_str,
                                    timestamp=timestamp,
                                    size=stat.st_size,
                                    filename=filename,
                                )
                            )
                        except (ValueError, OSError):
                            # Skip invalid files
                            continue

        await loop.run_in_executor(None, scan_versions)

        # Sort by timestamp (newest first)
        versions.sort(key=lambda x: x.timestamp, reverse=True)
        return versions

    async def get_version(self, app: str, version: str) -> str:
        """Get content of a specific version.

        Args:
            app: App name.
            version: Version identifier (timestamp).

        Returns:
            File content.

        Raises:
            VersionNotFoundError: If version not found.
        """
        versions_path = self._get_versions_path(app)

        if not versions_path.exists():
            raise VersionNotFoundError(f"No versions found for app '{app}'")

        # Find version file
        version_files = list(versions_path.glob(f"{version}_*"))

        if not version_files:
            raise VersionNotFoundError(f"Version '{version}' not found for app '{app}'")

        version_path = version_files[0]

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: version_path.read_text(encoding="utf-8"))

    async def restore_version(self, app: str, version: str) -> str:
        """Restore a version to the main app directory.

        Args:
            app: App name.
            version: Version identifier (timestamp).

        Returns:
            Restored file content.

        Raises:
            VersionNotFoundError: If version not found.
        """
        content = await self.get_version(app, version)

        # Get original filename from version
        versions = await self.list_versions(app)
        version_info = next((v for v in versions if v.version == version), None)

        if not version_info:
            raise VersionNotFoundError(f"Version '{version}' not found for app '{app}'")

        return content

    async def delete_version(self, app: str, version: str) -> None:
        """Delete a specific version.

        Args:
            app: App name.
            version: Version identifier (timestamp).

        Raises:
            VersionNotFoundError: If version not found.
        """
        async with self._lock:
            versions_path = self._get_versions_path(app)

            if not versions_path.exists():
                raise VersionNotFoundError(f"No versions found for app '{app}'")

            # Find version file
            version_files = list(versions_path.glob(f"{version}_*"))

            if not version_files:
                raise VersionNotFoundError(f"Version '{version}' not found for app '{app}'")

            version_path = version_files[0]

            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, version_path.unlink)

    async def cleanup_old_versions(self, app: str, keep: int = 10) -> None:
        """Clean up old versions, keeping only the most recent ones.

        Args:
            app: App name.
            keep: Number of versions to keep (default 10).
        """
        async with self._lock:
            versions = await self.list_versions(app)

            if len(versions) <= keep:
                return

            # Delete old versions
            versions_to_delete = versions[keep:]

            loop = asyncio.get_event_loop()

            def delete_old():
                for version_info in versions_to_delete:
                    version_path = (
                        self._get_versions_path(app)
                        / f"{version_info.version}_{version_info.filename}"
                    )
                    if version_path.exists():
                        version_path.unlink()

            await loop.run_in_executor(None, delete_old)
