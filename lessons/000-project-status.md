# AppDaemon Studio - Project Status & Key Lessons

**Last Updated:** 2026-03-08
**Version:** 0.3.x
**Status:** Production Ready

---

## Current Architecture

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Frontend:** React 19 + Tailwind CSS
- **Editor:** Monaco Editor
- **Icons:** Lucide React
- **State:** Zustand

### Project Structure
```
/config/apps/                    # Home Assistant volume mount
  ├── apps.yaml                  # Single config for all apps
  ├── my_app.py                  # All Python modules (flat)
  ├── another_app.py
  └── .versions/                 # Centralized version storage
      ├── my_app_20260308120000.py
      └── my_app_20260308130000.py

appdaemon-studio/               # Add-on source
  ├── src/
  │   ├── app/
  │   │   ├── api/              # API Routes
  │   │   ├── components/       # React components
  │   │   ├── page.tsx          # Main IDE
  │   │   └── layout.tsx
  │   ├── lib/
  │   │   ├── file-manager.ts   # File operations
  │   │   └── version-control.ts # Versioning
  │   └── types/
  ├── Dockerfile                # Node.js 20 Alpine
  └── config.json               # Home Assistant config
```

---

## Critical Lessons Learned

### 1. Flat File Structure (CRITICAL)

**Problem:** Nested directories caused AppDaemon import failures
```
ModuleNotFoundError: spec not found for the module 'app_name'
Import paths:
  /config/apps
  /config/apps/other_app  ❌ Looking in wrong subdirectory
```

**Solution:** Use flat structure with single config
- All `.py` files in `/config/apps/` (no subdirectories)
- Single `apps.yaml` for all app configurations
- Centralized `.versions/` directory

**Why it works:**
- AppDaemon expects all modules in the same directory
- Follows standard AppDaemon conventions
- Simplifies module resolution

**Reference:** Lesson 008

---

### 2. File Creation Order Matters

**Problem:** Creating Python file before YAML config causes race condition

**Wrong Order:**
```typescript
// ❌ Python created first
await fs.writeFile(`${app}.py`, pythonContent);
await fs.writeFile(`${app}.yaml`, yamlContent);
```

AppDaemon detects `.py` file immediately but config doesn't exist yet → **app fails to load**

**Correct Order:**
```typescript
// ✅ Config created first
await writeAppsConfig(config);  // YAML first
await fs.writeFile(`${app}.py`, pythonContent);  // Python second
```

**Why it works:**
- Config exists before AppDaemon detects the module
- App can be instantiated with correct settings immediately

**Reference:** Lesson 007

---

### 3. Next.js 16 Async Params

**Problem:** TypeScript errors after upgrading to Next.js 16

**Before (Next.js 14):**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { app: string } }
) {
  const app = params.app;  // ❌ Error in Next.js 16
}
```

**After (Next.js 16):**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ app: string }> }
) {
  const { app } = await params;  // ✅ Must await
}
```

**Key Changes:**
- `params` is now a Promise
- `headers()` is now async
- `cookies()` is now async

**Reference:** Lesson 009

---

### 4. Monaco Editor Integration

**Setup:**
```typescript
import Editor from '@monaco-editor/react';

<Editor
  height="100%"
  language="python"
  theme="vs-dark"
  value={code}
  onChange={handleChange}
  onMount={handleEditorDidMount}
  options={{
    minimap: { enabled: false },
    fontSize: 14,
    quickSuggestions: true,
  }}
/>
```

**Custom Completions:**
- AppDaemon API methods
- Home Assistant entities
- Python builtins
- Signature help for methods

**Reference:** Lesson 005

---

### 5. Toast Notifications (No Alerts)

**Implementation:**
```typescript
// ✅ Use toast notifications
const { addToast } = useToast();

addToast({
  type: 'success',
  message: 'File saved successfully',
});

// ❌ Never use alerts/confirms
alert('File saved');  // Blocks UI, bad UX
```

**Why:**
- Non-blocking
- Better UX
- Auto-dismisses
- Multiple toasts possible

---

### 6. Version Comparison with Monaco DiffEditor

**Usage:**
```typescript
import { DiffEditor } from '@monaco-editor/react';

<DiffEditor
  original={oldVersion}
  modified={currentVersion}
  language="python"
  options={{
    readOnly: true,
    renderSideBySide: true,
  }}
/>
```

**Benefits:**
- Visual diff (green/red highlights)
- Side-by-side or inline
- Synced scrolling

---

## Migration History

### From Python/FastAPI to Next.js

**Before (v0.2.x):**
- Python FastAPI backend (port 8000)
- Nginx reverse proxy (port 5000)
- React frontend (separate build)
- 3 processes, 500MB image

**After (v0.3.x):**
- Next.js full-stack (port 3000)
- Single TypeScript codebase
- 1 process, 200MB image
- 2-3x faster builds

**Key Changes:**
- `aiofiles` → `fs.promises`
- `pathlib.Path` → `path` module
- FastAPI routes → Next.js API routes
- Multi-stage Dockerfile → Single-stage

**Reference:** Lesson 008 (Next.js Migration)

---

## API Endpoints

### Apps
- `GET /api/apps` - List all apps
- `POST /api/apps` - Create new app
- `DELETE /api/files/[app]` - Delete app

### Files
- `GET /api/files/[app]/python` - Get Python file
- `PUT /api/files/[app]/python` - Save Python file
- `GET /api/files/[app]/yaml` - Get apps.yaml (global config)

### Versions
- `GET /api/versions/[app]` - List versions
- `GET /api/versions/[app]/[timestamp]` - Get version content
- `PUT /api/versions/[app]` - Restore version

### Entities
- `GET /api/entities` - Get Home Assistant entities

### Health
- `GET /api/health` - Health check

---

## Common Patterns

### File Operations

**Reading:**
```typescript
import { promises as fs } from 'fs';

const content = await fs.readFile(filePath, 'utf-8');
```

**Writing:**
```typescript
await fs.writeFile(filePath, content);
```

**Directory listing:**
```typescript
const entries = await fs.readdir(dir, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isFile()) { /* ... */ }
}
```

### Error Handling

```typescript
try {
  await fs.access(filePath);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
    // File not found
  }
}
```

### Auto-Discovery Pattern

```typescript
// Scan for .py files
const files = await fs.readdir(APPS_DIR);
const pythonFiles = files.filter(f => f.endsWith('.py'));

// Merge with config
const config = await readAppsConfig();
for (const pyFile of pythonFiles) {
  const appName = pyFile.replace('.py', '');
  if (!config[appName]) {
    // Add with defaults
    config[appName] = {
      module: appName,
      class: await extractClassName(pyFile),
      icon: 'mdi:application',
      description: '',
    };
  }
}
```

---

## Testing Checklist

Before deploying:

- [ ] Build succeeds: `npm run build`
- [ ] TypeScript compiles: No errors
- [ ] Create new app - appears in `apps.yaml`
- [ ] Edit Python file - saves correctly
- [ ] Delete app - removes from config
- [ ] Version creation - stores in `.versions/`
- [ ] Version restore - works correctly
- [ ] Version comparison - UI works
- [ ] **AppDaemon loads apps without errors** (main goal)
- [ ] Existing apps discovered and shown
- [ ] Frontend displays all apps

---

## Known Issues & Solutions

### 1. AppDaemon Import Errors
**Cause:** Nested directory structure
**Solution:** Flat structure (all `.py` files in `/config/apps/`)

### 2. Apps Not Loading on Creation
**Cause:** Python file created before config
**Solution:** Create config first, then Python file

### 3. TypeScript Errors on Next.js 16
**Cause:** `params` is now Promise
**Solution:** `const { app } = await params;`

### 4. Version Comparison Not Loading
**Cause:** Missing timestamp endpoint
**Solution:** Created `/api/versions/[app]/[timestamp]` route

---

## Future Improvements

### Planned
- [ ] Syntax validation (Python linter)
- [ ] YAML validation
- [ ] App settings UI (edit icon, description)
- [ ] Bulk operations
- [ ] Import/export apps
- [ ] App templates library

### Considerations
- Migration script for old nested installations
- Custom Monaco themes
- Real-time collaboration
- Git integration

---

## Resources

- [Next.js 16 Docs](https://nextjs.org/docs)
- [AppDaemon Docs](https://appdaemon.readthedocs.io/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/)
- [Home Assistant Add-ons](https://developers.home-assistant.io/docs/add-ons)
- [Node.js fs.promises](https://nodejs.org/api/fs.html#fs_promises_api)

---

## Quick Reference

### Create App
```bash
POST /api/apps
{
  "name": "my_app",
  "class_name": "MyApp",
  "description": "Does something",
  "icon": "mdi:lightbulb"
}
```

### Save File
```bash
PUT /api/files/my_app/python
{
  "content": "import hass\n\nclass MyApp(hass.Hass):\n  ..."
}
```

### List Versions
```bash
GET /api/versions/my_app
# Returns: { versions: [...], count: 5 }
```

### Restore Version
```bash
PUT /api/versions/my_app
{
  "versionId": "20260308120000"
}
```

---

## Related Documentation

- `AGENTS.md` - Agent instructions
- `README.md` - User documentation
- `tasks/` - Task specifications
- `MIGRATION.md` - Migration guide

---

**This document supersedes:**
- Lesson 001-007 (outdated, pre-Next.js)
- Lesson 008 (Next.js migration - kept for reference)
- Lesson 009 (Next.js 16 changes - kept for reference)
