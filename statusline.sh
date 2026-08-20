#!/bin/bash
#
# Claude Code statusline for CSTOM
# Renders: folder | model | git branch | context usage | session cost
#
# Reads the Claude Code status JSON from stdin and prints a single line.
# Git lookups are cached for CACHE_TTL seconds to keep the prompt snappy.

input=$(cat)

# --- Settings ----------------------------------------------------------------
CACHE_FILE="$HOME/.claude/.statusline_cache"
CACHE_TTL=10  # seconds; git state changes often, keep this short

# ANSI colors (Claude Code renders these). Empty if NO_COLOR is set.
if [[ -z "$NO_COLOR" ]]; then
    C_RESET=$'\033[0m'; C_DIM=$'\033[2m'
    C_CYAN=$'\033[36m'; C_MAGENTA=$'\033[35m'
    C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'; C_RED=$'\033[31m'
else
    C_RESET=""; C_DIM=""; C_CYAN=""; C_MAGENTA=""
    C_GREEN=""; C_YELLOW=""; C_RED=""
fi

# --- Parse JSON --------------------------------------------------------------
# Single jq pass; path separators normalized to '/' and basename computed in jq
# so we never rely on the shell mangling Windows backslashes.
if command -v jq >/dev/null 2>&1; then
    IFS=$'\t' read -r model_name current_dir project_name \
        ctx_pct ctx_input ctx_size total_cost lines_added lines_removed <<EOF
$(printf '%s' "$input" | jq -r '
    def norm: (. // "") | gsub("\\\\"; "/") | sub("/$"; "");
    [
      (.model.display_name // "Claude"),
      ((.workspace.current_dir // .cwd // "") | norm),
      (((.workspace.project_dir // .workspace.current_dir // .cwd // "") | norm | split("/") | last) // "no-project"),
      (.context_window.used_percentage // ""),
      (.context_window.total_input_tokens // ""),
      (.context_window.context_window_size // ""),
      (.cost.total_cost_usd // ""),
      (.cost.total_lines_added // ""),
      (.cost.total_lines_removed // "")
    ] | @tsv
' 2>/dev/null)
EOF
else
    # Minimal fallback when jq is unavailable.
    grab() { printf '%s' "$input" | grep -o "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | sed 's/.*:[[:space:]]*"\([^"]*\)".*/\1/' | head -1; }
    model_name=$(grab display_name); [[ -z "$model_name" ]] && model_name="Claude"
    current_dir=$(grab current_dir | sed 's|\\|/|g')
    project_name=$(basename "${current_dir:-no-project}")
fi

[[ -z "$model_name" ]] && model_name="Claude"
[[ -z "$project_name" ]] && project_name="no-project"

# --- Git branch + status (cached) --------------------------------------------
git_branch=""; git_status=""
if [[ -n "$current_dir" ]] && git -C "$current_dir" rev-parse --git-dir >/dev/null 2>&1; then
    cache_ok=0
    if [[ -f "$CACHE_FILE" ]]; then
        cache_content=$(cat "$CACHE_FILE" 2>/dev/null)
        cache_dir=$(printf '%s' "$cache_content" | sed -n 's/^DIR=//p')
        cache_time=$(printf '%s' "$cache_content" | sed -n 's/^TIME=//p')
        if [[ "$cache_dir" == "$current_dir" && -n "$cache_time" ]]; then
            age=$(( $(date +%s) - cache_time ))
            if [[ $age -le $CACHE_TTL ]]; then
                git_branch=$(printf '%s' "$cache_content" | sed -n 's/^BRANCH=//p')
                git_status=$(printf '%s' "$cache_content" | sed -n 's/^STATUS=//p')
                cache_ok=1
            fi
        fi
    fi

    if [[ $cache_ok -eq 0 ]]; then
        git_branch=$(git -C "$current_dir" branch --show-current 2>/dev/null)
        [[ -z "$git_branch" ]] && git_branch=$(git -C "$current_dir" rev-parse --short HEAD 2>/dev/null)
        if [[ -n "$git_branch" ]]; then
            [[ -n $(git -C "$current_dir" status --porcelain 2>/dev/null) ]] && git_status="*"
            if git -C "$current_dir" rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
                ahead=$(git -C "$current_dir" rev-list --count '@{u}..HEAD' 2>/dev/null)
                behind=$(git -C "$current_dir" rev-list --count 'HEAD..@{u}' 2>/dev/null)
                [[ "$ahead" -gt 0 ]] 2>/dev/null && git_status="${git_status} ↑${ahead}"
                [[ "$behind" -gt 0 ]] 2>/dev/null && git_status="${git_status} ↓${behind}"
            fi
        fi
        printf 'DIR=%s\nTIME=%s\nBRANCH=%s\nSTATUS=%s\n' \
            "$current_dir" "$(date +%s)" "$git_branch" "$git_status" > "$CACHE_FILE" 2>/dev/null
    fi
fi

# --- Build components --------------------------------------------------------
components=()
components+=("${C_CYAN}📁 ${project_name}${C_RESET}")
components+=("${C_MAGENTA}🤖 ${model_name}${C_RESET}")

if [[ -n "$git_branch" ]]; then
    branch_color="$C_GREEN"
    [[ "$git_status" == *"*"* ]] && branch_color="$C_YELLOW"
    components+=("${branch_color}🌿 ${git_branch}${git_status}${C_RESET}")
fi

# Context window usage with color thresholds
if [[ -n "$ctx_pct" ]]; then
    ctx_pct_int=${ctx_pct%.*}; [[ -z "$ctx_pct_int" ]] && ctx_pct_int=0
    if   [[ $ctx_pct_int -ge 80 ]]; then ctx_color="$C_RED"
    elif [[ $ctx_pct_int -ge 50 ]]; then ctx_color="$C_YELLOW"
    else ctx_color="$C_GREEN"; fi

    if [[ -n "$ctx_input" && "$ctx_input" != "0" && -n "$ctx_size" && "$ctx_size" != "0" ]]; then
        components+=("${ctx_color}🧠 $((ctx_input / 1000))K/$((ctx_size / 1000))K (${ctx_pct_int}%)${C_RESET}")
    else
        components+=("${ctx_color}🧠 ${ctx_pct_int}%${C_RESET}")
    fi
fi

# Lines changed this session
if [[ -n "$lines_added$lines_removed" ]] && [[ "${lines_added:-0}" -gt 0 || "${lines_removed:-0}" -gt 0 ]] 2>/dev/null; then
    components+=("${C_DIM}±${C_RESET}${C_GREEN}+${lines_added:-0}${C_RESET}${C_DIM}/${C_RESET}${C_RED}-${lines_removed:-0}${C_RESET}")
fi

# Session cost
if [[ -n "$total_cost" && "$total_cost" != "0" ]]; then
    cost_fmt=$(printf "%.2f" "$total_cost" 2>/dev/null)
    [[ -n "$cost_fmt" ]] && components+=("${C_DIM}💰 \$${cost_fmt}${C_RESET}")
fi

# --- Join and print ----------------------------------------------------------
output=""
for i in "${!components[@]}"; do
    if [[ $i -eq 0 ]]; then output="${components[$i]}"
    else output="${output} ${C_DIM}|${C_RESET} ${components[$i]}"; fi
done
printf '%s\n' "$output"
