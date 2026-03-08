# Markdown Files Cleanup Proposal

**Date**: 2026-03-08
**Current Version**: 0.3.0 (Next.js 16.1.6, React 19.2.4)

## Overview

Project has completed migration to Next.js 16. Many migration-related documents are now obsolete.

---

## Files to REMOVE (Migration Complete)

### Root Level
- ❌ **MIGRATION.md** - Migration guide, no longer needed

### Tasks (Migration Complete)
- ❌ **tasks/005-nextjs-migration.md** - Next.js migration task (Python → Next.js)
- ❌ **tasks/008-flat-structure-migration.md** - Flat structure migration
- ❌ **tasks/008-nextjs-16-migration.md** - Next.js 16 upgrade task

### Lessons (Historical Only)
- ❌ **lessons/008-nextjs-migration.md** - Python to Next.js migration (historical)
- ❌ **lessons/009-nextjs-16-breaking-changes.md** - Next.js 16 breaking changes (resolved)

**Total to remove: 6 files**

---

## Files to KEEP (Active/Reference)

### Root Level
- ✅ **README.md** - Main documentation
- ✅ **CHANGELOG.md** - Version history
- ✅ **AGENTS.md** - Agent instructions

### Docs (All Active)
- ✅ **docs/api-reference.md** - API documentation
- ✅ **docs/architecture.md** - System architecture
- ✅ **docs/deployment.md** - Deployment guide
- ✅ **docs/testing-guide.md** - Testing guide
- ✅ **docs/ui-design.md** - UI design
- ⚠️ **docs/gitlab-runner-macos.md** - Setup guide (might be outdated)
- ⚠️ **docs/gitlab-runner-podman-macos.md** - Setup guide (might be outdated)

### Lessons (Current Reference)
- ✅ **lessons/000-project-status.md** - Current project status (START HERE)
- ✅ **lessons/005-monaco-editor.md** - Monaco Editor guide (reference)
- ✅ **lessons/008-flat-structure-complete.md** - Current architecture
- ✅ **lessons/010-unrelated-files-cleanup.md** - Recent cleanup log
- ✅ **lessons/README.md** - Index

### Tasks (Completed/Recent)
- ✅ **tasks/001-addon-structure.md** - Base setup (reference)
- ✅ **tasks/002-backend-api.md** - Backend API (reference)
- ✅ **tasks/003-frontend-ui.md** - Frontend UI (reference)
- ✅ **tasks/004-gitlab-ci.md** - CI/CD (reference)
- ✅ **tasks/006-intellisense-autocomplete.md** - Feature task
- ✅ **tasks/010-fix-versions-error.md** - Recent bug fix
- ✅ **tasks/011-editor-settings-themes-fonts.md** - Recent feature
- ⚠️ **tasks/README.md** - Needs update (outdated index)

---

## Cleanup Commands

### Remove Migration Files
```bash
# Remove root migration guide
rm MIGRATION.md

# Remove completed migration tasks
rm tasks/005-nextjs-migration.md
rm tasks/008-flat-structure-migration.md
rm tasks/008-nextjs-16-migration.md

# Remove historical migration lessons
rm lessons/008-nextjs-migration.md
rm lessons/009-nextjs-16-breaking-changes.md
```

### Update Indexes
```bash
# Update tasks/README.md (remove completed tasks from index)
# Update lessons/README.md (already up to date)
```

---

## Optional: Archive Instead of Delete

If you want to keep migration history for reference:

```bash
# Create archive directory
mkdir -p archive/migrations

# Move instead of delete
mv MIGRATION.md archive/migrations/
mv tasks/005-nextjs-migration.md archive/migrations/
mv tasks/008-*.md archive/migrations/
mv lessons/008-nextjs-migration.md archive/migrations/
mv lessons/009-nextjs-16-breaking-changes.md archive/migrations/

# Add to .gitignore
echo "archive/" >> .gitignore
```

---

## Decision Required

✅ **COMPLETED: Delete** (2026-03-08)
- All migration files removed
- Git history preserves information if needed
- Cleaner repository structure

---

## After Cleanup ✅

**Final structure:**
```
├── README.md
├── CHANGELOG.md
├── AGENTS.md
├── docs/ (7 files)
├── lessons/ (6 files including this one)
└── tasks/ (8 files)
```

**Total removed: 6 files**

**Cleanup executed:** 2026-03-08

---

## Recommended Action

✅ **Delete migration files** - Migration is complete, git history has all information

```bash
# Execute cleanup
rm MIGRATION.md
rm tasks/005-nextjs-migration.md tasks/008-*.md
rm lessons/008-nextjs-migration.md lessons/009-nextjs-16-breaking-changes.md

# Update tasks/README.md to reflect only active/completed tasks
```
