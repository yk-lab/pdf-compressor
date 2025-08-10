---
description: Check Vue component sizes and identify components that may need refactoring
---

# Check Component Size

This command analyzes Vue component sizes to identify components that may benefit from refactoring or splitting.

## Instructions

- Check the line count of all Vue components
- Identify components exceeding 100 lines (recommended threshold)
- Analyze the largest components for refactoring opportunities
- Provide recommendations for component splitting if needed

## Commands

- Line count analysis: !`wc -l src/components/*.vue src/App.vue | sort -rn`
- Component structure: !`eza src/components --tree`

## Analysis Guidelines

- Components > 100 lines: Consider splitting
- Components > 150 lines: Strongly recommend splitting
- Look for:
  - Multiple responsibilities in a single component
  - Reusable logic that could be extracted to composables
  - UI sections that could be separate child components
