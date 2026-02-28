# Lesson 004: AI Integration

## What I Learned

### Proxy Pattern

AI API keys must stay server-side:
```python
# backend
@app.post("/api/ai/chat")
async def ai_chat(request: ChatRequest):
    # Key is stored in environment/config
    response = await ai_provider.chat(
        request.message,
        api_key=settings.ai_api_key
    )
    return {"response": response}
```

### Provider Abstraction

```python
from abc import ABC, abstractmethod

class AIProvider(ABC):
    @abstractmethod
    async def chat(self, messages: list) -> str:
        pass

class OllamaProvider(AIProvider):
    async def chat(self, messages: list) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.host}/api/chat",
                json={"model": self.model, "messages": messages}
            )
            return response.json()["message"]["content"]
```

### Prompt Engineering

System prompt for AppDaemon:
```python
APPDAEMON_SYSTEM_PROMPT = """You are an expert in Home Assistant and AppDaemon.
Help users write Python apps for home automation.
Use proper AppDaemon patterns:
- Use self.log() for logging
- Use listen_state, run_daily, etc.
- Handle errors gracefully
- Include type hints"""

messages = [
    {"role": "system", "content": APPDAEMON_SYSTEM_PROMPT},
    {"role": "user", "content": user_message}
]
```

### Context Awareness

Include current file in context:
```python
async def chat_with_context(message: str, current_file: str = None):
    context = ""
    if current_file:
        context = f"Current file:\n```python\n{current_file}\n```\n\n"
    
    return await ai.chat(context + message)
```

### Rate Limiting

```python
from slowapi import Limiter

limiter = Limiter(key_func=lambda: request.client.host)

@app.post("/api/ai/chat")
@limiter.limit("10/minute")
async def ai_chat(request: Request, data: ChatRequest):
    ...
```

## Provider-Specific Notes

### Ollama
- Self-hosted, no API key needed
- Supports streaming responses
- Models: codellama, llama2, mistral

### Opencode Zen
- Free tier available
- Key from https://opencode.ai
- Tier-based model access

### Claude
- Requires API key
- Good for explanations
- More expensive but accurate

### OpenAI
- Most popular
- GPT-4 or GPT-3.5-turbo
- Token-based pricing

## Error Handling

```python
async def safe_ai_call(func, *args, **kwargs):
    try:
        return await func(*args, **kwargs)
    except httpx.TimeoutException:
        raise AIError("Request timed out")
    except httpx.HTTPError as e:
        raise AIError(f"API error: {e}")
    except Exception as e:
        raise AIError(f"Unexpected error: {e}")
```

## Resources

- https://platform.openai.com/docs
- https://docs.anthropic.com/
- https://github.com/ollama/ollama
