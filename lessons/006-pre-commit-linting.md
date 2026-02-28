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

## Critical Lesson: CI is Stricter Than Local

**Your local environment is often more lenient than CI.** Common causes:
- Different Python versions (CI uses 3.11, you might have 3.14)
- Different mypy configurations (CI uses strict mode)
- Missing dependencies (CI installs specific versions)

**Always check CI logs carefully** - they show the real errors.

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

#### 3. MyPy Type Errors (CI is Strict!)

**Error: "Function is missing a return type annotation"**
```python
# Bad:
def my_function():
    pass

# Good:
def my_function() -> None:
    pass

# For route handlers:
async def root() -> dict:
    return {"status": "ok"}
```

**Error: "Function is missing a type annotation for one or more arguments"**
```python
# Bad:
async def logs_endpoint(lines=100):
    pass

# Good:
async def logs_endpoint(lines: int = 100) -> dict:
    pass

# For helper functions:
def version_info_to_response(info: VersionInfo) -> VersionInfoResponse:
    ...
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

**Error: "Function is missing a type annotation" (fixtures)**
```python
# Bad:
@pytest_asyncio.fixture
async def file_manager(tmp_path):
    ...

# Good:
@pytest_asyncio.fixture
async def file_manager(tmp_path: Path) -> AsyncGenerator[FileManager, None]:
    ...

# Or for simple fixtures:
@pytest_asyncio.fixture
async def version_control(tmp_path: Path) -> VersionControl:
    ...
```

**Error: "Returning Any from function declared to return 'str'"**
```python
# Bad:
def render_template() -> str:
    template = Template(template_content)
    return template.render(...)  # Returns Any

# Good:
def render_template() -> str:
    template = Template(template_content)
    result: str = template.render(...)
    return result
```

**Error: "Missing return statement"**
```python
# Bad:
def scan_versions() -> list[VersionInfo]:
    for item in path.iterdir():
        ...
    # No return statement!

# Good:
def scan_versions() -> None:  # Modifies outer scope list
    for item in path.iterdir():
        ...
# OR
def scan_versions() -> list[VersionInfo]:
    versions: list[VersionInfo] = []
    for item in path.iterdir():
        ...
    return versions
```

**Error: "Nested functions need types too"**
```python
# Bad:
def outer():
    def inner():  # Needs type annotation!
        pass
    
# Good:
def outer() -> None:
    def inner() -> None:  # Add return type
        pass
```

**Error: "Item 'None' has no attribute 'X'" (Optional handling)**
```python
# Bad:
app = next((a for a in apps if a.name == "x"), None)
assert app.version_count >= 1  # Error: app could be None

# Good:
app = next((a for a in apps if a.name == "x"), None)
assert app is not None  # Type guard
assert app.version_count >= 1  # Now OK
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

#### 5. Configuration File Errors

**pyproject.toml TOML Syntax Error**
```toml
# Bad - inline tables with newlines:
per-file-ignores = {
    "api/*.py" = ["B008", "B904"]
}

# Good - use proper table format:
[tool.ruff.lint.per-file-ignores]
"api/*.py" = ["B008", "B904"]
```

#### 6. pytest-asyncio Compatibility Issues

**Error: "Unknown config option: asyncio_default_fixture_loop_scope"**
```toml
# Bad - this option doesn't exist in older pytest-asyncio:
[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "function"  # Remove this!

# Good:
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

**Error: "AttributeError: 'Package' object has no attribute 'obj'"**
```
This happens with incompatible pytest-asyncio versions.
Fix: Remove the asyncio_default_fixture_loop_scope config option.
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

### Auto-Install Hooks (Recommended)

We provide auto-install hooks that run after git operations:

```bash
# Run the install script
./install-hooks.sh

# Or manually copy all hooks
cp hooks/pre-commit .git/hooks/pre-commit
cp hooks/post-checkout .git/hooks/post-checkout
cp hooks/post-merge .git/hooks/post-merge
chmod +x .git/hooks/*
```

The hooks will auto-install when you:
- Clone the repository
- Checkout a branch
- Pull/merge changes

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

## Debugging CI Failures

### When CI Fails But Local Passes

1. **Check Python version**
   ```yaml
   # .gitlab-ci.yml uses:
   image: python:3.11-alpine
   ```

2. **Check installed packages**
   ```yaml
   before_script:
     - pip install ruff mypy types-PyYAML --quiet
   ```

3. **Run the exact same commands locally**
   ```bash
   cd app
   ruff check . --output-format=gitlab
   ruff format --check .
   mypy . --ignore-missing-imports
   ```

4. **Check for missing imports**
   ```python
   # CI might fail on:
   from typing import AsyncGenerator  # Missing import!
   
   # Make sure to import:
   from collections.abc import AsyncGenerator
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

### Making Lint Non-Critical (Emergency Only)

If you absolutely need to bypass linting temporarily:

```yaml
lint-python:
  allow_failure: true  # Pipeline continues even if lint fails
```

**DO NOT commit this to main!** Fix the actual issues instead.

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
- [pytest-asyncio Documentation](https://pytest-asyncio.readthedocs.io/)

## Summary of All Fixes Applied

This lesson documents 47+ type errors we fixed:

1. Added return types to all functions (`-> None`, `-> dict`, etc.)
2. Added parameter types to all functions (e.g., `info: VersionInfo`)
3. Added proper fixture types for pytest
4. Fixed nested function types
5. Fixed TOML syntax in pyproject.toml
6. Removed unsupported pytest-asyncio config
7. Added type guards for Optional types
8. Fixed Jinja2 Any return values
9. Added missing imports (Path, AsyncGenerator, etc.)

**Key Takeaway**: CI is always stricter. When in doubt, add explicit types everywhere!
