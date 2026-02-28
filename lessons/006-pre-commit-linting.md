# Lesson: Pre-commit Linting and Testing

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
```bash
# Error: "Function is missing a return type annotation"
# Fix: Add type annotations

# Bad:
def my_function():
    pass

# Good:
def my_function() -> None:
    pass

# Bad:
async def test_something(tmp_path):
    pass

# Good:
async def test_something(tmp_path: Path) -> None:
    pass
```

#### 4. Test Function Types
Test functions MUST have type annotations:
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

## CI/CD Pipeline Stages

```
lint-python     → Format check, lint, type check
lint-typescript → ESLint, type check
test-backend    → pytest with coverage
build-ui        → Vite build
test-frontend   → (if you add this)
build-docker    → Only on main branch
push-registry   → Only on tags
```

## Definition of Done

A task is **complete** when:
- [ ] All linting passes (backend + frontend)
- [ ] All tests pass
- [ ] Frontend builds successfully
- [ ] Docker builds successfully (if applicable)
- [ ] Changes committed and pushed
- [ ] CI/CD pipeline is green

## Resources

- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [MyPy Documentation](https://mypy.readthedocs.io/)
- [ESLint Documentation](https://eslint.org/docs/)
