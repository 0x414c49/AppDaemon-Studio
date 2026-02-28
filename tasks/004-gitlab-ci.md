# Task 004: GitLab CI/CD Pipeline

## Objective

Create GitLab CI pipeline for automated building, testing, and deployment.

## Requirements

### Pipeline Structure

```yaml
stages:
  - lint
  - test
  - build
  - push
  - release
```

### Complete .gitlab-ci.yml

```yaml
variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"
  NODE_MODULES_CACHE: "$CI_PROJECT_DIR/ui/node_modules"
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - .cache/pip
    - ui/node_modules

stages:
  - lint
  - test
  - build
  - push
  - release

workflow:
  rules:
    - if: $CI_COMMIT_TAG
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_MERGE_REQUEST_IID

# ==========================================
# LINT STAGE
# ==========================================

lint-python:
  stage: lint
  image: python:3.11-alpine
  before_script:
    - pip install ruff mypy --quiet
  script:
    - cd app
    - ruff check . --output-format=gitlab > ruff-report.json || true
    - ruff format --check . || true
    - mypy . --ignore-missing-imports
  artifacts:
    reports:
      codequality: app/ruff-report.json
    paths:
      - app/ruff-report.json
    expire_in: 1 week
  only:
    - merge_requests
    - main

lint-typescript:
  stage: lint
  image: node:20-alpine
  before_script:
    - cd ui && npm ci --silent
  script:
    - npm run lint
    - npm run typecheck
  only:
    - merge_requests
    - main

# ==========================================
# TEST STAGE
# ==========================================

test-backend:
  stage: test
  image: python:3.11
  before_script:
    - pip install -r requirements.txt
    - pip install pytest pytest-asyncio pytest-cov httpx
  script:
    - cd app
    - pytest tests/ -v --cov=. --cov-report=xml --cov-report=term
  coverage: '/TOTAL.+ ([0-9]{1,3}%)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: app/coverage.xml
    paths:
      - app/coverage.xml
    expire_in: 1 week
  only:
    - merge_requests
    - main

# ==========================================
# BUILD STAGE
# ==========================================

build-ui:
  stage: build
  image: node:20-alpine
  before_script:
    - cd ui && npm ci --silent
  script:
    - npm run build
  artifacts:
    paths:
      - ui/dist/
    expire_in: 1 week
  only:
    - merge_requests
    - main

build-docker:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
  only:
    - main

# ==========================================
# PUSH STAGE
# ==========================================

push-registry:
  stage: push
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker pull $DOCKER_IMAGE
    - docker tag $DOCKER_IMAGE $CI_REGISTRY_IMAGE:latest
    - docker tag $DOCKER_IMAGE $CI_REGISTRY_IMAGE:$CI_COMMIT_TAG
    - docker push $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_TAG
  only:
    - tags

# ==========================================
# RELEASE STAGE
# ==========================================

release:
  stage: release
  image: registry.gitlab.com/gitlab-org/release-cli:latest
  script:
    - release-cli create 
      --name "Release $CI_COMMIT_TAG"
      --description "AppDaemon Studio $CI_COMMIT_TAG"
      --tag-name $CI_COMMIT_TAG
      --assets-link "{\"name\":\"Docker Image\",\"url\":\"$CI_REGISTRY_IMAGE:$CI_COMMIT_TAG\"}"
  only:
    - tags
```

### Additional Configuration Files

#### app/pyproject.toml (for ruff/mypy)
```toml
[tool.ruff]
line-length = 100
target-version = "py311"
select = ["E", "F", "I", "N", "W", "UP", "B", "C4", "SIM"]
ignore = ["E501"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

#### ui/.eslintrc.cjs
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
```

### CI/CD Variables

Configure these in GitLab:
- `CI_REGISTRY_USER` - GitLab registry username
- `CI_REGISTRY_PASSWORD` - GitLab deploy token (read_registry, write_registry)

### Pipeline Behavior

**Merge Requests:**
- Lint Python and TypeScript
- Run backend tests
- Build UI
- Report coverage

**Main Branch:**
- All MR checks
- Build Docker image
- Push to registry with SHA tag

**Tags (Releases):**
- Tag image as `latest` and version
- Create GitLab release

## Acceptance Criteria

- [ ] Pipeline runs on MR, main, and tags
- [ ] Python linting with ruff (E, F, I, N rules)
- [ ] TypeScript linting with eslint
- [ ] Backend tests with pytest + coverage
- [ ] Docker image builds and pushes to registry
- [ ] Releases created automatically for tags
- [ ] Caching works (pip, npm)
- [ ] Coverage reports available in MRs
- [ ] Code quality reports visible

## Notes

- Use GitLab Container Registry (built-in)
- Parallel job execution where possible
- Artifact passing between jobs
- Cache dependencies for speed
- Only build Docker on main (not MRs)

## Time Estimate

3-4 hours