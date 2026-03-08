# Task 010: Fix "Failed to Load Versions" Error

## Status: TESTING NEEDED

### Changes Deployed (2026-03-08)

**Commit:** `394f90a`

**Added Comprehensive Logging:**

1. **Server-side** (`/api/versions/[app]/route.ts`)
   - Logs: App name, version count, errors
   - Better error messages with context

2. **Server-side** (`version-control.ts`)
   - Logs: App name, VERSIONS_DIR path
   - Logs: Directory creation, file count
   - Logs: Matching files found, error details

3. **Client-side** (`VersionCompare.tsx`)
   - Logs: API calls, response status
   - Logs: Loaded version count, error details
   - Better error messages with HTTP codes

**To Test:**

1. Wait for CI/CD to build and deploy (automatically triggered)
2. Open your Home Assistant instance
3. Open browser DevTools (F12) → Console tab
4. Click on an app → Click "Compare" button
5. Look for logs in browser console:
   ```
   [VersionCompare] Loading versions for: app_name
   [VersionCompare] Response status: 200
   [VersionCompare] Loaded X versions
   ```

6. Check server logs (Docker container):
   ```bash
   docker logs appdaemon-studio
   ```
   Look for:
   ```
   [Versions API] Listing versions for app: app_name
   [Version Control] VERSIONS_DIR: /config/apps/.versions
   [Version Control] Found X files in versions directory
   [Version Control] Found X versions for app_name
   ```

7. **Report back:**
   - What do you see in browser console?
   - What's in the Docker logs?
   - What's the exact error message?

This will help us identify if it's:
- ❌ Routing issue (404 = route not found)
- ❌ File system issue (no versions directory)
- ❌ Permission issue (can't read directory)
- ❌ Pattern matching issue (wrong file names)

---

## Problem

Users are experiencing "Failed to load versions" error when trying to view or manage app versions.

## Symptoms

- Error message appears when accessing version functionality
- Version list doesn't display
- Version comparison may fail
- HTTP 404 error on `/api/versions/solar_data` endpoint

## Investigation Steps

### 1. Check Version Directory
```bash
# In container or on host
ls -la /config/apps/.versions/

# Check permissions
stat /config/apps/.versions/
```

### 2. Check Version Files
```bash
# List version files
ls -la /config/apps/.versions/ | grep "app_name"

# Check file naming
ls /config/apps/.versions/ | grep -E "^\w+_\d{14}\.py$"
```

### 3. Test API Endpoints
```bash
# List versions for an app
curl http://localhost:3000/api/versions/test_app

# Get specific version
curl http://localhost:3000/api/versions/test_app/20260308120000
```

## Possible Solutions

### Solution 1: Create Missing Directory
```typescript
// In version-control.ts
async function ensureVersionsDir(): Promise<void> {
  try {
    await fs.access(VERSIONS_DIR);
  } catch {
    await fs.mkdir(VERSIONS_DIR, { recursive: true });
  }
}
```

### Solution 2: Fix File Naming Pattern
```typescript
// Ensure consistent naming
const versionFile = `${appName}_${timestamp}.py`;
// Where timestamp = YYYYMMDDHHMMSS (14 digits)
```

### Solution 3: Add Error Handling
Already implemented - returns empty array instead of throwing.

## Files Modified

1. `src/lib/version-control.ts` - Added logging and error handling
2. `src/app/api/versions/[app]/route.ts` - Added logging
3. `src/app/components/VersionCompare.tsx` - Added client-side logging

## Priority

**HIGH** - Core functionality broken

## Estimated Effort

- Diagnosis: 30 min (with logging)
- Fix: 30 min (once root cause identified)
- Testing: 15 min

**Total: 1-2 hours**

## Next Steps

1. ✅ Add comprehensive logging
2. ⏳ Deploy and test
3. ⏳ Identify root cause from logs
4. ⏳ Implement fix
5. ⏳ Verify with user
