---
description: Suggest appropriate branch names based on staged changes
---

# Recommend Branch Name from Staged Changes

This command analyzes staged changes and suggests appropriate branch names following Git best practices.

## Instructions

- Analyze the staged changes to understand the scope and type of changes
- Identify the primary purpose (feature, fix, refactor, docs, test, etc.)
- Suggest 3-5 branch name options following common naming conventions
- Provide reasoning for each suggestion

## Commands

- View staged changes: !`git diff --cached --stat`
- Detailed staged diff: !`git diff --cached`
- List staged files: !`git diff --cached --name-only`

## Branch Naming Conventions

- **feature/**: New features or enhancements
- **fix/**: Bug fixes
- **refactor/**: Code refactoring without functional changes
- **docs/**: Documentation updates
- **test/**: Test additions or modifications
- **chore/**: Maintenance tasks, dependency updates
- **perf/**: Performance improvements

## Examples

- `feature/user-authentication`
- `fix/payment-processing-error`
- `refactor/extract-pdf-utilities`
- `docs/api-documentation`
- `test/add-unit-tests-for-compression`
