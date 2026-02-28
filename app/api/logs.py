"""Logs API endpoints."""


from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel

from app.services.log_watcher import LogWatcher

router = APIRouter(prefix="/logs", tags=["logs"])


class LogsResponse(BaseModel):
    """Recent logs response."""

    lines: list[str]
    count: int


# Global log watcher instance
_log_watcher: LogWatcher | None = None


def get_log_watcher() -> LogWatcher:
    """Dependency to get or create LogWatcher instance."""
    global _log_watcher
    if _log_watcher is None:
        _log_watcher = LogWatcher()
    return _log_watcher


@router.get("/", response_model=LogsResponse)
async def get_recent_logs(
    lines: int = 100, log_watcher: LogWatcher = Depends(get_log_watcher)
) -> LogsResponse:
    """Get recent log lines."""
    try:
        log_lines = await log_watcher.get_recent_logs(lines=lines)
        return LogsResponse(lines=log_lines, count=len(log_lines))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read logs: {str(e)}",
        )


@router.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    """WebSocket endpoint for real-time log streaming."""
    log_watcher = get_log_watcher()

    await websocket.accept()

    try:
        # Start log watcher if not running
        if not log_watcher._running:
            await log_watcher.start()

        # Subscribe to log updates
        await log_watcher.subscribe(websocket)

        # Keep connection alive and handle client messages
        while True:
            try:
                # Wait for messages from client (ping/keepalive)
                data = await websocket.receive_text()

                # Handle ping
                if data == "ping":
                    await websocket.send_json({"type": "pong"})

                # Handle filter requests
                elif data.startswith("filter:"):
                    # TODO: Implement log filtering
                    pass

            except WebSocketDisconnect:
                break
            except Exception:
                break

    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass

    finally:
        # Unsubscribe from log updates
        await log_watcher.unsubscribe(websocket)

        # Stop log watcher if no more subscribers
        if len(log_watcher._subscribers) == 0:
            await log_watcher.stop()
