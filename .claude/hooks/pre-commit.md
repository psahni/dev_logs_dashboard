# Pre-Commit Hook — Documentation

> **Status: NOT YET IMPLEMENTED.** This is documentation only.
> When you implement the hook, update this file to reflect the actual configuration
> and remove this notice.

This file documents the intended pre-commit hook behavior for Dev Digest. Use it as
a reference when implementing the actual `.git/hooks/pre-commit` or a lefthook/Husky
configuration.

---

## Intended Behavior

The pre-commit hook runs automatically on `git commit` and blocks the commit if any
check fails. Where possible, checks run against staged files only to keep the hook fast.

---

## Checks to Run

### 1. TypeScript Type Check (frontend)
```bash
cd frontend && npx tsc --noEmit
```
Blocks the commit if there are TypeScript errors. Runs if any `.ts` or `.tsx` file
is staged.

### 2. ESLint (frontend)
```bash
cd frontend && npx eslint . --ext .ts,.tsx --max-warnings 0
```
Blocks the commit on any ESLint error or warning. Runs if any `.ts` or `.tsx` file
is staged.

### 3. Python Type Check (backend and mcp-server)
```bash
cd backend && uv run mypy app/
cd mcp-server && uv run mypy server.py
```
Runs if any `.py` file is staged in the respective directory.

### 4. Python Lint (backend and mcp-server)
```bash
cd backend && uv run ruff check app/
cd mcp-server && uv run ruff check server.py
```
Ruff is the preferred linter (replaces flake8 + isort). Blocks on errors.

### 5. Tests
```bash
cd frontend && npm test -- --passWithNoTests
cd backend && uv run pytest --tb=short -q
```
Runs the full test suite. Blocks if any test fails. Tests are not skipped even if no
test files are staged — a commit could break an unrelated test.

---

## Implementation Notes

- **Tool**: Use [lefthook](https://github.com/evilmartians/lefthook) for cross-platform
  hook management. It supports parallel job execution so TypeScript and Python checks
  can run simultaneously.
- **Staged-files-only**: For lint checks, pass only staged file paths to speed up the hook.
- **Skip flag**: Allow `SKIP=typecheck git commit` for emergency bypasses. Document this
  in the root CLAUDE.md when the hook is live.
- **Drizzle drift check**: Consider adding a check that flags when `frontend/src/db/schema.ts`
  has staged changes but no new file exists in `frontend/drizzle/`. This prevents schema
  changes from landing without a corresponding migration file.

---

## lefthook.yml Shape (reference)

```yaml
pre-commit:
  parallel: true
  commands:
    ts-typecheck:
      glob: "frontend/src/**/*.{ts,tsx}"
      run: cd frontend && npx tsc --noEmit
    ts-lint:
      glob: "frontend/src/**/*.{ts,tsx}"
      run: cd frontend && npx eslint {staged_files} --max-warnings 0
    py-lint-backend:
      glob: "backend/**/*.py"
      run: cd backend && uv run ruff check {staged_files}
    py-lint-mcp:
      glob: "mcp-server/**/*.py"
      run: cd mcp-server && uv run ruff check {staged_files}
```
