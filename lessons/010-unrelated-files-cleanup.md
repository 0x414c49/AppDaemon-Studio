# Unrelated Files and Cleanup Log

**Date**: 2026-03-08
**Purpose**: Document all scripts, markdowns, and files that are non-essential or unrelated to production

## Summary

Found multiple categories of files that could be considered unrelated to production code:

## 1. Debug Scripts (Development Tools)

**Location**: Project root
**Purpose**: Development and debugging utilities

### Files:
- `debug.sh` - Home Assistant connection testing with curl
- `debug-compose.sh` - Docker Compose debug launcher
- `debug-docker.sh` - Direct Docker debug launcher
- `docker-compose.debug.yml` - Docker Compose configuration for debugging

**Status**: ✅ Keep (useful for development)
**Recommendation**: Move to `scripts/` or `tools/` directory for better organization

---

## 2. Backup Files

**Location**: Project root
**Purpose**: Old package configuration backups

### Files:
- `package.json.backup` (780 bytes)
- `package-lock.json.backup` (223,515 bytes)

**Status**: ❌ Remove
**Reason**: Version control (git) already tracks history
**Action**: 
```bash
rm package.json.backup package-lock.json.backup
```

---

## 3. macOS System Files

**Location**: Project root
**Purpose**: macOS Finder metadata

### Files:
- `.DS_Store` (10,244 bytes)

**Status**: ❌ Remove and ignore
**Reason**: Should not be in version control
**Action**:
```bash
rm .DS_Store
# Already in .gitignore
```

---

## 4. Empty Directories

**Location**: Project root
**Purpose**: Unknown

### Files:
- `.gitlab/` - Empty directory (no files)

**Status**: ❌ Remove
**Reason**: Directory is empty, not used
**Action**:
```bash
rmdir .gitlab
```

---

## 5. Duplicate CI/CD Systems

**Location**: `.github/workflows/`
**Purpose**: GitHub Actions CI/CD

### Files:
- `.github/workflows/build.yml` - GitHub Actions workflow

**Status**: ⚠️ Review
**Context**: Project uses GitLab CI (`.gitlab-ci.yml`)
**Question**: Why are there two CI systems?
**Options**:
1. Remove `.github/` if only using GitLab CI
2. Keep both if mirroring to GitHub
3. Document why both exist

---

## 6. Test Data Directory

**Location**: `test-apps/`
**Purpose**: Local testing with Home Assistant

### Contents:
```
test-apps/
├── .versions/
├── adasd/
├── apps.yaml
├── qwe/
├── test/
├── test1.py
└── test2.py
```

**Status**: ⚠️ Keep out of git
**Reason**: Development/test data
**Action**: Add to `.gitignore`:
```
test-apps/
```

---

## 7. Screenshot Utility

**Location**: `scripts/take-screenshots.ts`
**Purpose**: Generate README screenshots with Playwright

**Status**: ✅ Keep
**Reason**: Documentation tool
**Dependencies**: Requires Playwright (`npm install -D playwright`)

---

## 8. Multiple Script Directories

**Locations**: 
- `scripts/` (contains start.sh, take-screenshots.ts)
- Root level (contains debug-*.sh)

**Status**: ⚠️ Reorganize
**Recommendation**: Consolidate all scripts in `scripts/` directory:
```
scripts/
├── start.sh
├── debug.sh
├── debug-compose.sh
├── debug-docker.sh
└── take-screenshots.ts
```

---

## 9. Documentation Files (Keep)

All markdown files are related and should be kept:

### Root Level:
- `README.md` - Main documentation
- `CHANGELOG.md` - Version history
- `AGENTS.md` - Agent instructions
- `MIGRATION.md` - Migration guide

### Directories:
- `docs/` - Detailed documentation
- `lessons/` - Lessons learned
- `tasks/` - Task specifications

**Status**: ✅ All markdown files are project-related

---

## Cleanup Actions

### ✅ Completed:
```bash
# Removed backup files
rm package.json.backup package-lock.json.backup

# Removed macOS metadata
rm .DS_Store

# Removed empty directory
rmdir .gitlab

# Reorganized scripts
mv debug.sh debug-compose.sh debug-docker.sh docker-compose.debug.yml scripts/

# Updated documentation references
# - MIGRATION.md
# - lessons/009-nextjs-16-breaking-changes.md
# - tasks/008-nextjs-16-migration.md

# Fixed script paths
# - scripts/debug-compose.sh: Updated docker-compose paths
# - scripts/docker-compose.debug.yml: Updated context, env_file, and volume paths
# - Removed obsolete version: '3.8' from docker-compose file
```

### ⚠️ Decision Needed:
- [ ] Keep or remove `.github/workflows/` (dual CI system) - User confirmed to keep
- [ ] Decide on script organization structure

---

## Files Summary Table

| File/Dir | Type | Status | Action |
|----------|------|--------|--------|
| `debug*.sh` | Scripts | ✅ Moved | Relocated to scripts/ |
| `docker-compose.debug.yml` | Config | ✅ Moved | Relocated to scripts/ |
| `package*.backup` | Backups | ✅ Removed | Deleted |
| `.DS_Store` | macOS | ✅ Removed | Deleted |
| `.gitlab/` | Empty dir | ✅ Removed | Deleted |
| `.github/workflows/` | CI/CD | ✅ Kept | Dual CI system retained |
| `test-apps/` | Test data | ✅ Ignored | Already in .gitignore |
| `scripts/take-screenshots.ts` | Utility | ✅ Kept | Documentation tool |
| `*.md` | Docs | ✅ Kept | All related to project |

---

## Prevention

To prevent future clutter:

1. **Update .gitignore**:
```gitignore
# macOS
.DS_Store

# Backups
*.backup
*.bak

# Test data
test-apps/

# Environment files
.env.local
```

2. **Script Organization**:
   - All scripts go in `scripts/`
   - Document in README.md

3. **CI/CD**:
   - Choose one system (GitLab or GitHub)
   - Remove unused CI config

---

## Next Steps

1. ✅ Review this log
2. ✅ Execute cleanup commands
3. ✅ Test application still works (docker-compose script verified)
4. ⬜ Commit cleanup changes
5. N/A Update documentation (already updated)
