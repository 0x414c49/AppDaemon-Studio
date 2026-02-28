# Lesson 003: WebSocket and Real-time Features

## What I Learned

### WebSocket in FastAPI

```python
from fastapi import WebSocket

@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_text()
            # Process and broadcast
            await websocket.send_text(log_line)
    except WebSocketDisconnect:
        pass
```

### Log Tailing Strategy

Use `watchdog` for file changes:
```python
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class LogHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path == self.log_file:
            self.read_new_lines()
```

Alternative: asyncio with polling:
```python
async def tail_file(path: Path, websocket: WebSocket):
    with open(path, 'r') as f:
        f.seek(0, 2)  # Go to end
        while True:
            line = f.readline()
            if line:
                await websocket.send_text(line)
            else:
                await asyncio.sleep(0.1)
```

### Connection Management

Track active connections:
```python
class ConnectionManager:
    def __init__(self):
        self.connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connections.add(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        self.connections.discard(websocket)
    
    async def broadcast(self, message: str):
        for conn in self.connections:
            await conn.send_text(message)
```

### Client-side Reconnection

```typescript
const connectWebSocket = () => {
  const ws = new WebSocket(url);
  
  ws.onclose = () => {
    setTimeout(connectWebSocket, 3000); // Reconnect after 3s
  };
  
  return ws;
};
```

## Performance Considerations

- Limit concurrent connections (max 10)
- Use async/await throughout
- Batch log lines if high volume
- Implement backpressure

## Resources

- https://fastapi.tiangolo.com/advanced/websockets/
- https://python-watchdog.readthedocs.io/
