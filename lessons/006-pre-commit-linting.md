# Lesson: Pre-commit Linting and Type Safety

## Why This Matters

**CI/CD pipelines will reject your code if linting fails.**

The GitLab pipeline runs:
1. **lint-python**: Ruff format check, Ruff lint, MyPy type check
2. **lint-typescript**: ESLint, TypeScript compiler check
3. **test-backend**: pytest with coverage
4. **build-ui**: Vite production build
5. **build-docker**: Docker image creation

If any step fails, the entire pipeline fails and you can't merge.

## Common Failures

### Backend (Python)

#### 1. Ruff Formatting Issues
```bash
# Error: "Would reformat: api/apps.py"
# Fix: Run formatter
cd app
ruff format .
```

#### 2. Ruff Lint Errors
```bash
# Error: Undefined variable, unused import, etc.
# Fix: Check and fix the reported issues
cd app
ruff check .
```

#### 3. MyPy Type Errors

**Error: "Function is missing a return type annotation"**
```python
# Bad:
def my_function():
    pass

# Good:
def my_function() -> None:
    pass
```

**Error: "Function is missing a type annotation for one or more arguments"**
```python
# Bad:
async def logs_endpoint(lines=100):
    pass

# Good:
async def logs_endpoint(lines: int = 100) -> dict:
    pass
```

**Error: "Function is missing a type annotation" (test functions)**
```python
# Bad:
async def test_create_app(tmp_path):
    pass

# Good:
async def test_create_app(tmp_path: Path) -> None:
    pass

# With fixtures:
async def test_create_app(file_manager: FileManager) -> None:
    pass
```

**Error: "Returning Any from function declared to return 'str'"**
```python
# Bad:
def process(data: dict) -> str:
    return data["key"]  # mypy doesn't know data["key"] is str

# Good:
from typing import Any

def process(data: dict[str, Any]) -> str:
    return str(data["key"])
```

**Error: Nested functions need types too**
```python
# Bad:
def scan_versions():
    for item in versions_path.iterdir():
        ...

# Good:
from typing import TypeVar

def scan_versions() -> list[VersionInfo]:
    for item in versions_path.iterdir():
        ...
```

#### 4. Test Function Types

All test functions MUST have type annotations:

```python
# Required for all test functions
async def test_create_app(file_manager: FileManager) -> None:
    ...

# Fixtures need types too
@pytest_asyncio.fixture
async def file_manager(tmp_path: Path) -> AsyncGenerator[FileManager, None]:
    ...
```

### Frontend (TypeScript)

#### 1. ESLint Unused Variables
```bash
# Error: 'waitFor' is defined but never used
# Fix: Remove unused imports

// Bad:
import { renderHook, waitFor } from '@testing-library/react';

// Good:
import { renderHook } from '@testing-library/react';
```

#### 2. Unused Destructured Values
```typescript
// Bad:
const { toasts, removeToast } = useAppStore();  // removeToast not used

// Good:
const { toasts } = useAppStore();
```

#### 3. Unused Variables
```typescript
// Bad:
const fileData = await api.savePythonFile(...);  // fileData never used

// Good:
await api.savePythonFile(...);
```

#### 4. ImportMetaEnv Type Error
```typescript
// Error: Property 'env' does not exist on type 'ImportMeta'
// Fix: Create vite-env.d.ts

// ui/src/vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCKS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## Pre-commit Hook

### Why Use a Pre-commit Hook?

- **Catches errors before they reach CI/CD**
- **Saves time** - fix locally instead of waiting for pipeline
- **Ensures consistent code quality**

### Installation

```bash
# Copy the hook to your local git hooks
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Or install with pre-commit framework (optional)
pip install pre-commit
pre-commit install
```

### What the Hook Checks

1. **Python Formatting** (`ruff format --check`)
2. **Python Linting** (`ruff check`)
3. **Python Type Checking** (`mypy`)
4. **TypeScript Linting** (`eslint`)
5. **TypeScript Type Checking** (`tsc --noEmit`)

### Bypassing the Hook (Emergency Only)

```bash
# Skip pre-commit checks
 git commit --no-verify
```

## Recommended Workflow

### Before Every Commit

1. **Save your work**
   ```bash
   git add .
   git stash  # if you want to be safe
   ```

2. **Run backend checks**
   ```bash
   cd app
   ruff format .        # Auto-fixes formatting
   ruff check .         # Reports issues
   mypy . --ignore-missing-imports
   pytest tests/ -v     # Run tests
   cd ..
   ```

3. **Run frontend checks**
   ```bash
   cd ui
   npm run lint         # Check for issues
   npm run typecheck    # TypeScript validation
   npm run test         # Run tests
   npm run build        # Production build
   cd ..
   ```

4. **Fix any errors**
   - Address all reported issues
   - Re-run checks until clean

5. **Commit and push**
   ```bash
   git add .
   git commit -m "Your message"
   git push
   ```

## Quick Fix Commands

### Auto-fix Python Issues
```bash
cd app
ruff check . --fix     # Auto-fix some issues
ruff format .          # Fix all formatting
```

### Auto-fix TypeScript Issues
```bash
cd ui
npm run lint -- --fix  # Auto-fix some ESLint issues
```

## CI/CD Pipeline Configuration

### Required Dependencies for CI

```yaml
# .gitlab-ci.yml
lint-python:
  before_script:
    - pip install ruff mypy types-PyYAML --quiet
  script:
    - cd app
    - ruff check .
    - ruff format --check .
    - mypy . --ignore-missing-imports
```

**Note**: Install `types-PyYAML` for mypy to type-check yaml module usage.

## Definition of Done

A task is **complete** when:
- [ ] All linting passes (backend + frontend)
- [ ] All type checks pass (mypy + tsc)
- [ ] All tests pass
- [ ] Frontend builds successfully
- [ ] Docker builds successfully (if applicable)
- [ ] Pre-commit hook runs successfully
- [ ] Changes committed and pushed
- [ ] CI/CD pipeline is green

## Resources

- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [MyPy Documentation](https://mypy.readthedocs.io/)
- [MyPy Common Issues](https://mypy.readthedocs.io/en/stable/common_issues.html)
- [ESLint Documentation](https://eslint.org/docs/)
- [Pre-commit Framework](https://pre-commit.com/)
