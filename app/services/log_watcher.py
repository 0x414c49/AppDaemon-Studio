"""Log watcher service for real-time log streaming."""

import asyncio
from pathlib import Path
from typing import Callable, Optional, Set

from fastapi import WebSocket

from app.config import get_settings


class LogWatcherError(Exception):
    """Base exception for log watcher errors."""

    pass


class LogWatcher:
    """Watches AppDaemon log file and streams to WebSocket clients."""

    def __init__(self, log_path: Optional[Path] = None):
        """Initialize log watcher.

        Args:
            log_path: Path to log file. Defaults to config setting.
        """
        self.log_path = log_path or get_settings().appdaemon_log_path
        self._subscribers: Set[WebSocket] = set()
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._file_position = 0
        self._lock = asyncio.Lock()

    async def start(self) -> None:
        """Start watching the log file."""
        if self._running:
            return

        self._running = True
        self._task = asyncio.create_task(self._watch_loop())

    async def stop(self) -> None:
        """Stop watching the log file."""
        self._running = False

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def subscribe(self, websocket: WebSocket) -> None:
        """Subscribe a WebSocket to receive log updates.

        Args:
            websocket: WebSocket connection.
        """
        async with self._lock:
            self._subscribers.add(websocket)

        # Send initial position info
        await websocket.send_json({"type": "connected", "message": "Connected to log stream"})

    async def unsubscribe(self, websocket: WebSocket) -> None:
        """Unsubscribe a WebSocket from log updates.

        Args:
            websocket: WebSocket connection.
        """
        async with self._lock:
            self._subscribers.discard(websocket)

    async def broadcast(self, message: str, level: str = "info") -> None:
        """Broadcast a message to all subscribers.

        Args:
            message: Message to broadcast.
            level: Log level (info, warning, error, debug).
        """
        if not self._subscribers:
            return

        data = {
            "type": "log",
            "level": level,
            "message": message,
            "timestamp": asyncio.get_event_loop().time(),
        }

        # Send to all subscribers
        disconnected = []

        async with self._lock:
            for websocket in self._subscribers:
                try:
                    await websocket.send_json(data)
                except Exception:
                    disconnected.append(websocket)

            # Remove disconnected clients
            for websocket in disconnected:
                self._subscribers.discard(websocket)

    async def _watch_loop(self) -> None:
        """Main watch loop that reads log file and broadcasts updates."""
        # Wait for log file to exist
        while self._running and not self.log_path.exists():
            await asyncio.sleep(1)

        if not self._running:
            return

        # Start at end of file
        try:
            stat = self.log_path.stat()
            self._file_position = stat.st_size
        except OSError:
            self._file_position = 0

        while self._running:
            try:
                await self._read_new_lines()
                await asyncio.sleep(0.5)  # Check every 500ms
            except asyncio.CancelledError:
                break
            except Exception:
                # Log errors but keep running
                await asyncio.sleep(1)

    async def _read_new_lines(self) -> None:
        """Read new lines from log file."""
        if not self.log_path.exists():
            return

        try:
            stat = self.log_path.stat()

            # Check if file was rotated (new file)
            if stat.st_size < self._file_position:
                self._file_position = 0

            if stat.st_size == self._file_position:
                return

            # Read new content
            loop = asyncio.get_event_loop()

            def read_file():
                with open(self.log_path, "r", encoding="utf-8", errors="replace") as f:
                    f.seek(self._file_position)
                    content = f.read()
                    new_position = f.tell()
                    return content, new_position

            content, new_position = await loop.run_in_executor(None, read_file)
            self._file_position = new_position

            # Broadcast lines
            if content and self._subscribers:
                lines = content.split("\n")
                for line in lines:
                    if line.strip():
                        await self.broadcast(line)

        except OSError:
            pass

    async def get_recent_logs(self, lines: int = 100) -> list:
        """Get recent log lines.

        Args:
            lines: Number of lines to return.

        Returns:
            List of log lines.
        """
        if not self.log_path.exists():
            return []

        try:
            loop = asyncio.get_event_loop()

            def read_logs():
                with open(self.log_path, "r", encoding="utf-8", errors="replace") as f:
                    all_lines = f.readlines()
                    return all_lines[-lines:] if len(all_lines) > lines else all_lines

            log_lines = await loop.run_in_executor(None, read_logs)
            return [line.rstrip("\n") for line in log_lines]

        except OSError:
            return []
