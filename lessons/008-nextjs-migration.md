# Lesson: Migrating from Python/FastAPI to Next.js Full-Stack

## The Problem

Our original architecture had too many moving parts:
- **Python FastAPI** backend (port 8000)
- **Nginx** reverse proxy (port 5000) 
- **React** frontend (built to static files)
- **Complex routing** for Home Assistant Ingress
- **Slow builds** on Home Assistant Green (ARM64)

This caused:
- API routing issues through Ingress proxy
- Permission errors with nginx
- 3-5 minute build times
- 500MB Docker images

## The Solution: Next.js Full-Stack

### Why Next.js?

**Single Process Architecture:**
```
Before:  Browser → Nginx → Python API
                    ↓
              Static React

After:   Browser → Next.js (API + Frontend)
```

**Benefits:**
1. ✅ One port (3000) instead of two
2. ✅ One language (TypeScript) instead of two (Python + TS)
3. ✅ Simpler Ingress routing (basePath built-in)
4. ✅ Faster builds (no Python dependencies)
5. ✅ Smaller images (~200MB vs ~500MB)

### Migration Strategy

**Backend Migration:**

Python FastAPI → Next.js API Routes

```python
# Before: Python/FastAPI
@app.get("/api/apps")
async def get_apps():
    apps = await list_apps()
    return {"apps": apps}
```

```typescript
// After: Next.js API Route
export async function GET() {
  const apps = await listApps();
  return NextResponse.json({ apps });
}
```

**Key Differences:**

| Python | Node.js/TypeScript |
|--------|-------------------|
| `async def` | `async function` |
| `await` | `await` (same) |
| `pathlib.Path` | `path` module |
| `aiofiles` | `fs.promises` |
| `os.mkdir` | `fs.mkdir` |
| `with open()` | `fs.readFile/writeFile` |

### File Operations Migration

**Reading Directory:**
```python
# Python
entries = await aiofiles.os.scandir(APPS_DIR)
for entry in entries:
    if entry.is_dir():
        apps.append(entry.name)
```

```typescript
// Node.js
const entries = await fs.readdir(APPS_DIR, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isDirectory()) {
    apps.push(entry.name);
  }
}
```

**File Paths:**
```python
# Python
from pathlib import Path
file_path = APPS_DIR / app_name / f"{app_name}.py"
```

```typescript
// Node.js
import path from 'path';
const filePath = path.join(APPS_DIR, appName, `${appName}.py`);
```

### Project Structure Comparison

**Before (Python + React):**
```
appdaemon-studio/
├── app/                    # Python backend
│   ├── api/
│   ├── services/
│   └── main.py
├── ui/                     # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── nginx.conf
├── requirements.txt
└── Dockerfile              # Multi-stage (complex)
```

**After (Next.js):**
```
appdaemon-studio/
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/          # API routes (was Python)
│   │   ├── components/   # React components
│   │   ├── page.tsx      # Main page
│   │   └── layout.tsx
│   ├── lib/              # Utilities
│   │   ├── file-manager.ts
│   │   └── version-control.ts
│   └── types/            # TypeScript types
├── package.json
├── next.config.js
└── Dockerfile            # Single stage (simple)
```

### Dockerfile Simplification

**Before (Multi-stage, ~500MB):**
```dockerfile
FROM python:3.11-alpine AS base
# ... install Python, nginx, nodejs
# ... multi-stage build
# COPY Python + Node + nginx configs
```

**After (Single-stage, ~200MB):**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Ingress Configuration

**Before (Complex nginx regex):**
```nginx
location ~ ^(.*)/api/(.*)$ {
    proxy_pass http://127.0.0.1:8000/api/$2;
}
```

**After (Next.js basePath):**
```javascript
// next.config.js
module.exports = {
  basePath: process.env.INGRESS_PATH || '',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};
```

## Migration Checklist

When migrating your own projects:

- [ ] Audit all Python dependencies (find Node.js equivalents)
- [ ] Migrate file operations (pathlib → path, aiofiles → fs.promises)
- [ ] Convert async/await syntax (similar in both)
- [ ] Update error handling (Python exceptions → TypeScript errors)
- [ ] Test file permissions (Node.js runs as different user)
- [ ] Update Dockerfile (simplify to single stage)
- [ ] Test Ingress routing (Next.js basePath vs nginx rewrite)
- [ ] Benchmark build times (should be 2-3x faster)

## Common Pitfalls

### 1. File Permissions
**Python:** Usually runs as root in containers
**Node.js:** Should run as non-root (appuser)

```dockerfile
# Add to Dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser
```

### 2. Path Handling
**Python:** `pathlib.Path` is object-oriented
**Node.js:** `path` module is functional

```typescript
// Join paths properly
import path from 'path';
const fullPath = path.join(BASE_DIR, appName, 'file.py');
```

### 3. Async File Operations
**Python:** `aiofiles` or `anyio`
**Node.js:** Built-in `fs.promises`

```typescript
import { promises as fs } from 'fs';
// fs.readFile, fs.writeFile, fs.mkdir are all async
```

### 4. Error Handling
**Python:** Try/except with specific exceptions
**Node.js:** Try/catch, check error types

```typescript
try {
  await fs.access(filePath);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
    // File not found
  }
}
```

## Performance Comparison

| Metric | Python+React+Nginx | Next.js |
|--------|-------------------|---------|
| Build Time | 3-5 min | 1-2 min |
| Image Size | ~500MB | ~200MB |
| Startup Time | 5-10s | 2-3s |
| Memory Usage | ~150MB | ~100MB |
| Cold Start | Slow | Fast |

## Conclusion

Next.js full-stack is ideal for Home Assistant add-ons because:
1. **Single codebase** - easier maintenance
2. **Better Ingress support** - built-in basePath handling
3. **Faster builds** - especially on ARM devices
4. **Smaller images** - faster downloads
5. **Type safety** - catch errors at build time

## Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Node.js fs.promises API](https://nodejs.org/api/fs.html#fs_promises_api)
- [Home Assistant Add-on Development](https://developers.home-assistant.io/docs/add-ons)
- [Task: Complete Next.js Migration](/tasks/005-nextjs-migration.md)
