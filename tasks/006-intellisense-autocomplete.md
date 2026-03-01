# Task: IntelliSense and Autocomplete for Home Assistant

## Overview
Implement intelligent code completion (IntelliSense) in the Monaco Editor for:
- Home Assistant entities (sensors, switches, lights, etc.)
- AppDaemon API methods and classes
- Python type hints for HA-specific types

## Motivation
Current editor has basic Python syntax highlighting but lacks:
- Auto-completion for `self.turn_on()`, `self.listen_state()`, etc.
- Entity ID suggestions (e.g., `light.living_room`)
- Type information for HA state objects
- Documentation on hover

This would significantly improve the developer experience.

## Technical Approach

### Phase 1: AppDaemon Type Definitions
Create TypeScript definition files for AppDaemon API:

```typescript
// src/types/appdaemon.d.ts
interface HassApp {
  turn_on(entity_id: string, **kwargs: any): void;
  turn_off(entity_id: string, **kwargs: any): void;
  listen_state(callback: StateCallback, entity: string): str;
  // ... all AppDaemon methods
}
```

**Effort:** 2-3 hours
**Value:** Medium (helps with AppDaemon API)

### Phase 2: Home Assistant Entity Discovery
Fetch entities from HA and provide as completions:

```typescript
// src/lib/entity-discovery.ts
export async function fetchHomeAssistantEntities(): Promise<Entity[]> {
  // Call HA REST API or WebSocket
  // Return list of entities with domains
}
```

**Implementation Options:**

#### Option A: REST API (Current best approach)
```typescript
const response = await fetch('http://supervisor/core/api/states', {
  headers: { 
    'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
    'Content-Type': 'application/json'
  }
});
const states = await response.json();
// Extract entity_ids
```

**Permissions needed:**
- `hassio_api: true`
- `hassio_role: default` (read-only access to states)

#### Option B: WebSocket (Real-time updates)
Connect to HA WebSocket API for live entity updates.

**Pros:**
- Real-time entity discovery
- Handles new entities immediately

**Cons:**
- More complex
- Connection management needed

#### Option C: Manual Import (No permissions)
Allow users to paste entity list or upload YAML.

**Pros:**
- Zero permissions
- Works offline

**Cons:**
- Manual step required
- Gets stale quickly

### Phase 3: Monaco Editor Integration
Register completion providers:

```typescript
// src/lib/monaco/completion-provider.ts
import { languages } from 'monaco-editor';

export function registerHACompletions(monaco: typeof import('monaco-editor')) {
  monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.', '('],
    provideCompletionItems: (model, position) => {
      // Check context (self.turn_on? entity_id?)
      // Return appropriate completions
      return {
        suggestions: [
          {
            label: 'light.living_room',
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: 'light.living_room',
            documentation: 'Living room light'
          }
        ]
      };
    }
  });
}
```

### Phase 4: Python Type Stubs
Generate or use existing Python type stubs for:
- `hass.Hass` class
- State objects
- Event objects
- Service calls

Can use: https://github.com/home-assistant/core or create custom stubs.

## Requirements

### Minimal Viable Product (MVP)
1. Basic AppDaemon method autocomplete (`self.turn_on`, `self.listen_state`, etc.)
2. Static list of common HA entities (cached)
3. Type hints for method parameters

### Full Implementation
1. Real-time entity discovery from HA
2. Domain-specific completions (lights, sensors, etc.)
3. Documentation on hover
4. Parameter hints
5. Go-to-definition for custom methods

## API Permissions Analysis

### For Entity Discovery (Option A - REST API)
```json
{
  "hassio_api": true,
  "hassio_role": "default"
}
```

**Risk Level:** Low
- `default` role has read-only access to states
- Cannot modify HA state
- Standard permission for add-ons that read HA data

### Comparison with Other Add-ons
- VS Code add-on: Uses `hassio_api: true` for entity browsing
- Node-RED: Uses `homeassistant_api: true` for entity access
- File Editor: No HA API access (file-only)

## Implementation Plan

### Sprint 1: Static Completions
- [ ] Create AppDaemon type definitions
- [ ] Register basic completion provider in Monaco
- [ ] Add static list of common entities (top 100)
- [ ] Test and refine

**Estimated:** 1 day
**No permissions required**

### Sprint 2: Dynamic Entity Discovery
- [ ] Add `hassio_api: true` to config.json
- [ ] Implement entity fetch from HA API
- [ ] Cache entities locally
- [ ] Refresh mechanism (manual button or auto)
- [ ] Filter by domain (lights, sensors, etc.)

**Estimated:** 1-2 days
**Requires: `hassio_api: true`**

### Sprint 3: Advanced Features
- [ ] Context-aware completions (inside `turn_on()` vs `listen_state()`)
- [ ] Parameter documentation
- [ ] Error detection (invalid entity IDs)
- [ ] Custom method completion (user's own app methods)

**Estimated:** 2-3 days

## Open Questions

1. **Permissions**: Is `hassio_api: true` acceptable for this feature?
   - Alternative: Make it optional (feature enabled only if permission granted)

2. **Performance**: How to handle 1000+ entities?
   - Lazy loading, virtual scrolling, caching

3. **Context Awareness**: How to detect when user is typing an entity_id vs method name?
   - Parse Python AST? Simple regex? Monaco token analysis?

4. **Updates**: How often to refresh entity list?
   - On app open? Manual refresh? WebSocket for real-time?

## References

- [Home Assistant REST API](https://developers.home-assistant.io/docs/api/rest/)
- [Monaco Editor Completion Provider](https://microsoft.github.io/monaco-editor/api/interfaces/monaco.languages.CompletionItemProvider.html)
- [AppDaemon API Reference](https://appdaemon.readthedocs.io/en/latest/APPGUIDE.html)
- [VS Code Home Assistant Add-on](https://github.com/hassio-addons/addon-vscode) - Shows how they handle entity discovery

## Status
**PENDING - Ready for Sprint Planning**

Priority: High (major UX improvement)
Blocked by: Permission decision needed
