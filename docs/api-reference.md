# API Reference

## Base URL

When accessed via Home Assistant Ingress:
```
/api/
```

## Authentication

All requests are authenticated via Home Assistant Ingress. No additional tokens required.

## REST Endpoints

### Apps

#### List All Apps
```http
GET /api/apps
```

Response:
```json
{
  "apps": [
    {
      "name": "motion_lights",
      "class_name": "MotionLights",
      "description": "Motion-activated lights",
      "has_python": true,
      "has_yaml": true,
      "last_modified": "2024-01-15T10:23:00Z"
    }
  ]
}
```

#### Create New App
```http
POST /api/apps
Content-Type: application/json

{
  "name": "motion_lights",
  "template": "motion_sensor",
  "config": {
    "class_name": "MotionLights",
    "sensor": "binary_sensor.hallway",
    "lights": ["light.hallway"],
    "delay": 300
  }
}
```

Response: `201 Created`

#### Get App Details
```http
GET /api/apps/{name}
```

Response:
```json
{
  "name": "motion_lights",
  "class_name": "MotionLights",
  "python_file": "motion_lights.py",
  "yaml_file": "motion_lights.yaml",
  "description": "Motion-activated lights",
  "config": {
    "sensor": "binary_sensor.hallway",
    "lights": ["light.hallway"],
    "delay": 300
  }
}
```

#### Update App
```http
PUT /api/apps/{name}
Content-Type: application/json

{
  "config": {
    "sensor": "binary_sensor.living_room"
  }
}
```

#### Delete App
```http
DELETE /api/apps/{name}
```

#### Reload App
```http
POST /api/apps/{name}/reload
```

### Files

#### Get Python File
```http
GET /api/files/{app}/python
```

Response:
```python
import appdaemon.plugins.hass.hassapi as hass

class MotionLights(hass.Hass):
    def initialize(self):
        pass
```

#### Update Python File
```http
PUT /api/files/{app}/python
Content-Type: text/plain

<python code>
```

#### Get YAML Config
```http
GET /api/files/{app}/yaml
```

Response:
```json
{
  "class": "MotionLights",
  "sensor": "binary_sensor.hallway",
  "lights": ["light.hallway"],
  "delay": 300
}
```

#### Update YAML Config
```http
PUT /api/files/{app}/yaml
Content-Type: application/json

{
  "sensor": "binary_sensor.kitchen"
}
```

### Logs

#### Get Recent Logs
```http
GET /api/logs?lines=100&filter=motion_lights
```

Query Parameters:
- `lines`: Number of lines (default: 100, max: 1000)
- `filter`: Filter by app name (optional)
- `level`: Filter by level: debug, info, warning, error (optional)

Response:
```json
{
  "logs": [
    {
      "timestamp": "2024-01-15T10:23:15Z",
      "level": "INFO",
      "app": "motion_lights",
      "message": "Motion detected"
    }
  ]
}
```

### Templates

#### List Templates
```http
GET /api/templates
```

Response:
```json
{
  "templates": [
    {
      "id": "basic",
      "name": "Basic App",
      "description": "Minimal AppDaemon app structure",
      "icon": "🏠"
    },
    {
      "id": "motion_sensor",
      "name": "Motion Sensor",
      "description": "Motion-activated lights",
      "icon": "🏃"
    }
  ]
}
```

#### Get Template
```http
GET /api/templates/{id}
```

Response:
```json
{
  "id": "motion_sensor",
  "name": "Motion Sensor",
  "description": "Motion-activated lights",
  "arguments": [
    {
      "name": "sensor",
      "type": "entity",
      "required": true,
      "description": "Motion sensor entity"
    },
    {
      "name": "lights",
      "type": "list",
      "required": true,
      "description": "List of light entities"
    },
    {
      "name": "delay",
      "type": "integer",
      "default": 300,
      "description": "Seconds to keep lights on"
    }
  ]
}
```

### AI

#### Chat with AI
```http
POST /api/ai/chat
Content-Type: application/json

{
  "message": "How do I create a sunset trigger?",
  "context": "import appdaemon...",
  "history": []
}
```

Response:
```json
{
  "response": "To create a sunset trigger...",
  "suggestions": ["code_example"]
}
```

#### Get Code Completion
```http
POST /api/ai/complete
Content-Type: application/json

{
  "code": "def initialize(self):\n    ",
  "position": 24,
  "language": "python"
}
```

Response:
```json
{
  "completion": "self.listen_state(self.on_state_change, \"binary_sensor.motion\")",
  "confidence": 0.95
}
```

#### Explain Code
```http
POST /api/ai/explain
Content-Type: application/json

{
  "code": "self.listen_state(self.callback, entity)"
}
```

Response:
```json
{
  "explanation": "This sets up a state listener that calls self.callback when the entity's state changes..."
}
```

#### Generate App
```http
POST /api/ai/generate
Content-Type: application/json

{
  "description": "Turn on porch light when door opens at night",
  "template": "basic"
}
```

Response:
```json
{
  "code": "import appdaemon...",
  "suggestions": ["Add sunset check", "Add delay"]
}
```

#### Get AI Configuration
```http
GET /api/ai/config
```

Response:
```json
{
  "provider": "ollama",
  "model": "codellama",
  "available_providers": ["ollama", "claude", "openai"]
}
```

#### Update AI Configuration
```http
PUT /api/ai/config
Content-Type: application/json

{
  "provider": "ollama",
  "ollama_host": "localhost",
  "ollama_port": 11434,
  "ollama_model": "codellama"
}
```

## WebSocket

### Connection
```
ws://host/ws/logs
```

### Messages

#### Server → Client: Log Line
```json
{
  "type": "log",
  "data": {
    "timestamp": "2024-01-15T10:23:15Z",
    "level": "INFO",
    "app": "motion_lights",
    "message": "Motion detected"
  }
}
```

#### Server → Client: File Changed
```json
{
  "type": "file_changed",
  "data": {
    "app": "motion_lights",
    "file": "motion_lights.py"
  }
}
```

#### Client → Server: Subscribe to App
```json
{
  "action": "subscribe",
  "app": "motion_lights"
}
```

#### Client → Server: Filter Logs
```json
{
  "action": "filter",
  "level": "INFO",
  "app": "motion_lights"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "APP_NOT_FOUND",
    "message": "App 'motion_lights' not found",
    "details": {}
  }
}
```

Common error codes:
- `APP_NOT_FOUND` - 404
- `FILE_NOT_FOUND` - 404
- `INVALID_CONFIG` - 400
- `AI_TIMEOUT` - 504
- `AI_ERROR` - 502
- `TEMPLATE_ERROR` - 500
- `VALIDATION_ERROR` - 400

## Rate Limits

- AI endpoints: 10 requests/minute (configurable)
- File operations: 100 requests/minute
- Log streaming: No limit (WebSocket)
