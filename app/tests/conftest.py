"""Test configuration and fixtures."""

import asyncio
import sys
from collections.abc import AsyncGenerator, Generator
from pathlib import Path

import pytest
import pytest_asyncio

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def tmp_apps_dir(tmp_path: Path) -> AsyncGenerator[Path, None]:
    """Create a temporary apps directory for testing."""
    apps_dir = tmp_path / "apps"
    apps_dir.mkdir()
    yield apps_dir


@pytest_asyncio.fixture
async def tmp_logs_dir(tmp_path: Path) -> AsyncGenerator[Path, None]:
    """Create a temporary logs directory for testing."""
    logs_dir = tmp_path / "logs"
    logs_dir.mkdir()
    yield logs_dir
