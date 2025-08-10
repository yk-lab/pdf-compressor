---
description: Fetch PR comments and implement necessary fixes based on feedback
---

# PR Feedback

This command fetches pull request comments and implements necessary fixes based on the feedback received.

## Instructions

- Get the current branch and identify the associated PR
- Fetch all PR comments and review feedback
- Analyze and prioritize the feedback items
- Implement fixes for each feedback item
- Make appropriate commits for each logical change
- Provide a summary of changes made

## Commands

- Current branch: !`git branch --show-current`
- Find PR for current branch: !`gh pr list --head $(git branch --show-current) --json number,title,state`
- Get PR comments: !`gh pr view --comments`
- Get review comments: !`gh api repos/{owner}/{repo}/pulls/{pull_number}/reviews`

## Implementation Guidelines

- Address each feedback item systematically
- Make atomic commits for each logical fix
- Use descriptive commit messages that reference the feedback
- Test changes after each fix
- Update PR description if significant changes are made
