---
description: Suggest appropriate branch names based on staged changes
---

# Recommend Branch Name from Staged Changes

This command analyzes staged changes and suggests appropriate branch names following Git best practices.

## Instructions

- Analyze the staged changes to understand the scope and type of changes
- Identify the primary purpose (feature, fix, refactor, docs, test, etc.)
- Include the scope/component in branch names (e.g., `feat/uploader-image-support`)
- Prefix with issue/ticket numbers if available (e.g., `feat/64-image-file-support`, `fix/issue-123-null-pointer`)
- Suggest 3-5 branch name options following the detailed naming rules below
- Provide reasoning for each suggestion including why the scope was chosen

## Commands

Current branch: !`git branch --show-current`
Short status: !`git status -sb`

## Branch Naming Rules

### Format Requirements

- **Lowercase kebab-case only**: Use only lowercase letters, numbers, and hyphens
- **ASCII characters only**: No special characters, emojis, or non-ASCII letters
- **Hyphens as separators**: Use hyphens (-) to separate words
- **Maximum 60 characters**: Keep branch names concise and under 60 characters
- **Include scope**: Add the component/module scope after the type prefix

### Git Restrictions

- **No spaces**: Spaces are not allowed in branch names
- **No special characters**: Forbidden characters include: `~`, `^`, `:`, `?`, `*`, `[`, `]`, `\`
- **No consecutive slashes**: Cannot have `//` in the name
- **No leading/trailing slashes**: Cannot start or end with `/`
- **No dots at start**: Cannot begin with `.`
- **No ending with .lock**: Cannot end with `.lock`

### Type Prefixes

- **feat/**: New features or enhancements
- **fix/**: Bug fixes
- **refactor/**: Code refactoring without functional changes
- **docs/**: Documentation updates
- **test/**: Test additions or modifications
- **chore/**: Maintenance tasks, dependency updates
- **perf/**: Performance improvements
- **build/**: Build system or external dependencies
- **ci/**: CI configuration and scripts
- **style/**: Formatting, missing semicolons, etc.; no code change
- **revert/**: Reverts a previous commit
- **wip/**: Work in progress (short-lived, squash before merge)

## Examples

### With Issue Numbers

- `feat/64-image-file-support`
- `fix/issue-123-null-pointer-exception`
- `refactor/78-extract-pdf-utilities`
- `docs/gh-102-api-documentation`

### With Scope (No Issue Number)

- `feat/uploader-image-support`
- `fix/pdf-compression-memory-leak`
- `refactor/auth-token-validation`
- `test/user-service-unit-tests`
- `chore/deps-update-vue-3.5`

### Bad Examples (DO NOT USE)

- `Feature/User Authentication` ❌ (uppercase letters)
- `fix/user_authentication` ❌ (underscore instead of hyphen)
- `feat//double-slash` ❌ (consecutive slashes)
- `/fix/leading-slash` ❌ (leading slash)
- `fix/trailing-slash/` ❌ (trailing slash)
- `feat/über-lösung` ❌ (non-ASCII characters)
- `fix user auth` ❌ (spaces)
- `feat/this-is-a-very-long-branch-name-that-exceeds-sixty-characters-limit` ❌ (too long)
