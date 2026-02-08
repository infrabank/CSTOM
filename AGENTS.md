# AGENTS.md

Repository purpose: personal Claude Code configuration, hooks, and automation scripts.
Use these rules when acting as an agent in this repo.

## Quick Orientation
- Primary area: .claude/ (agent configs, hooks, scripts)
- Specify tooling: .specify/ (templates, automation)
- OpenCode tooling: .opencode/ (commands, plugin)
- This is not a typical app repo; commands are script-centric.

## Build, Lint, Test Commands

### Python (agent tools and scripts)
- Run all tests: pytest tests/ -v --cov=src
  - Source: .claude/agents/test-runner.md
- Run a single test file: pytest path/to/test_file.py
- Lint Python (by convention in tooling): ruff check .
  - Source: .specify/scripts/powershell/update-agent-context.ps1

### JavaScript/TypeScript (if a feature plan specifies JS/TS)
- Run tests: npm test
- Run a single test: npm test -- path/to/test_file
- Lint: npm run lint
  - Source: .specify/scripts/powershell/update-agent-context.ps1

### Rust (if a feature plan specifies Rust)
- Run tests: cargo test
- Run a single test: cargo test test_name_substring
- Lint: cargo clippy
  - Source: .specify/scripts/powershell/update-agent-context.ps1

### Skill tooling (build/validate skills)
- Validate a skill: python .claude/skills/skill-creator/scripts/quick_validate.py <skill_dir>
- Package a skill: python .claude/skills/skill-creator/scripts/package_skill.py <skill_dir> [output_dir]

### Automation and context sync
- Update agent context: .specify/scripts/powershell/update-agent-context.ps1
- Update specific agent: .specify/scripts/powershell/update-agent-context.ps1 -AgentType <claude|gemini|copilot|...>
  - Source: .specify/scripts/powershell/update-agent-context.ps1

### Notes on commands
- There is no repo-wide build script or Makefile.
- Commands above are the canonical references found in repo tooling.

## Code Style Guidelines

### Global Documentation Rules
- Never use emojis in any text output or commits.
- Do not create new .md files unless explicitly instructed.
- Be extremely concise in markdown; prefer examples over prose.
- Default to 1-2 sentences per point unless complexity demands more.
- Front-load critical info and delete verbose explanations.
- Sources: .claude/CLAUDE.md, .claude/hooks/emoji_remover.py

### Commit and Authorship Rules
- Never set commit author to Claude or Anthropic.
- Do not add co-author lines referencing Claude or Anthropic.
- Use default git settings for commit author.
- Hooks enforce these rules on git commit.
- Sources: .claude/CLAUDE.md, .claude/hooks/clean_commit_guard.py

### Python Conventions (hooks and utilities)
- Imports: standard library, third-party, then local.
- Indentation: 4 spaces.
- Naming: snake_case for functions and variables.
- Structure: define a main() and guard with if __name__ == "__main__".
- Error handling: use try/except; do not fail hard in hooks.
- Example pattern: .claude/sync-docs.py

### PowerShell Conventions (workflow scripts)
- Functions: Verb-Noun with PascalCase (Get-RepoRoot).
- Indentation: 4 spaces.
- Error handling: try/catch; suppress expected git errors with 2>$null.
- Favor Join-Path for paths and PSCustomObject for structured data.
- Example pattern: .specify/scripts/powershell/common.ps1

### Markdown Conventions
- Keep sections short; remove verbose explanations.
- Front-load critical instructions and constraints.
- Avoid decorative formatting; no emojis.

### Naming Conventions
- Files: descriptive, kebab-case where new names are needed.
- Variables: language-standard conventions only.

### Error Handling
- Avoid empty catch blocks unless failure is explicitly non-blocking.
- For hook scripts, fail safe and keep output actionable.

## Tooling and Hooks Behavior
- Pre-tool hooks run from settings.json:
  - clean_commit_guard.py
  - github_issue_guard.py
  - protect_claude_md.py
  - emoji_remover.py
- Hooks may block commits or edits that violate rules.

## Cursor/Copilot Rules
- No .cursorrules or .cursor/rules found in repo.
- No .github/copilot-instructions.md found in repo.

## Suggested Workflow for Agents
1. Read .claude/CLAUDE.md before editing markdown files.
2. Prefer editing existing files over creating new ones.
3. When adding scripts, follow Python or PowerShell conventions above.
4. Run the smallest relevant command first (single test or validator).

## Repository-Specific Tips
- This repo is configuration-centric. Expect instructions and scripts, not app code.
- Respect hook constraints; they are enforced automatically.
- Use the agent templates in .specify/templates/ for consistent agent docs.

## File References
- .claude/CLAUDE.md
- .claude/hooks/clean_commit_guard.py
- .claude/hooks/emoji_remover.py
- .claude/sync-docs.py
- .specify/scripts/powershell/common.ps1
- .specify/scripts/powershell/update-agent-context.ps1
- .claude/agents/test-runner.md
- .specify/templates/agent-file-template.md

## Single-Test Examples
- Python: pytest tests/unit/test_example.py
- JS/TS: npm test -- tests/unit/example.test.ts
- Rust: cargo test test_name_substring

## Validation Checklist
- No emojis in any output.
- Concise markdown, minimal prose.
- Commands sourced from existing repo files.
- Follow language-specific conventions.

