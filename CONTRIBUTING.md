# Contributing to BlackhawkBraids

Thank you for taking the time to contribute! The following guidelines help keep contributions consistent and reviews efficient across all BlackhawkBraids repositories.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How to Report a Bug](#how-to-report-a-bug)
3. [How to Request a Feature](#how-to-request-a-feature)
4. [Submitting a Pull Request](#submitting-a-pull-request)
5. [Commit Message Style](#commit-message-style)
6. [Review Process](#review-process)

---

## Code of Conduct

All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

---

## How to Report a Bug

1. **Search existing issues** to avoid duplicates.
2. Open a new issue using the **Bug Report** template.
3. Include:
   - Steps to reproduce the problem
   - Expected vs. actual behavior
   - Environment details (OS, version, browser, etc.)
   - Logs or screenshots if relevant

---

## How to Request a Feature

1. **Search existing issues** to see if the idea has already been raised.
2. Open a new issue using the **Feature Request** template.
3. Describe the problem the feature would solve and, if possible, outline a proposed solution.

---

## Submitting a Pull Request

1. Fork the repository and create a branch from `main` (or the repository's default branch).
2. Keep your branch focused on a single change; open separate PRs for unrelated changes.
3. Make sure all existing tests pass before opening the PR.
4. Fill in the pull request template completely.
5. Link the PR to any related issue(s) using `Closes #<issue>` or `Relates to #<issue>` in the description.
6. Request review from the relevant team or `CODEOWNERS` if defined.

---

## Commit Message Style

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(optional scope): <short summary>

[optional body]

[optional footer(s)]
```

Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`.

---

## Review Process

- A maintainer will review your PR within **5 business days**.
- Automated checks (linting, tests, security scans) must pass before a human review begins.
- Address all review comments; the reviewer will re-review and approve or request further changes.
- Once approved by at least one maintainer, the PR will be merged using **squash merge** to keep the history clean.
