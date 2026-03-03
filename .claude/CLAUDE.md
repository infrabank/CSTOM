## Core Principles

- Never use emojis.

## Commit Authorship

When committing code changes:
- Never add Claude as a commit author.
- Always commit as using the default git settings

## Documentation Style

When creating or updating markdown documentation files:
- **Never create .md files unless explicitly instructed.**
- **Be extremely concise** - engineers scan, they don't read novels
- **Only include essential information** - what they need to know, not what's possible to explain
- **Prefer examples over prose** - show the pattern, not the theory
- **Assume technical competence** - skip obvious explanations
- **Front-load critical info** - put warnings and key concepts first
- **Delete verbose explanations** - if it takes more than 3 sentences, it's probably too long

Default to 1-2 sentence explanations. Only expand when complexity absolutely requires it.

## Code Editing Strategy

Minimize str_replace failures and token waste:

- **Small edit targets**: Use the minimum unique context in `old_string` (3-5 lines). Avoid copying large blocks just to change one line.
- **AST tools first**: For structural changes (rename, pattern replace across files), prefer `ast_grep_search`/`ast_grep_replace` over string-based Edit. They work with code structure, not raw text.
- **Write for large rewrites**: If changing more than ~40% of a file under 400 lines, use `Write` to rewrite the whole file instead of chaining many small `Edit` calls.
- **One Edit per logical change**: Don't batch unrelated changes into one `old_string` block. Separate edits are more precise and less prone to mismatch.