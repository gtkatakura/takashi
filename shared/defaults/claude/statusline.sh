#!/usr/bin/env bash
# Claude Code status line: Claude pipes the session as JSON to stdin and shows what this prints.
# Layout from https://statusline-community.zoniixyt.workers.dev/i/OIdHG1VwpU.sh

# printf must parse the cost as 1.23 even under comma-decimal locales like pt_BR
export LC_ALL=C

eval "$(jq -r '
  def whole: floor? // 0;

  # 15300 -> 15.3k, 1000000 -> 1M
  def compact:
    whole
    | if . < 1000 then tostring
      elif . < 1000000 then "\(. / 100 | floor | . / 10)k"
      else "\(. / 100000 | floor | . / 10)M"
      end;

  def duration:
    (whole / 1000 | floor) as $seconds
    | ($seconds / 60 | floor) as $minutes
    | if $seconds < 60 then "\($seconds)s"
      elif $minutes < 60 then "\($minutes)m" + (if $seconds % 60 > 0 then " \($seconds % 60)s" else "" end)
      else "\($minutes / 60 | floor)h" + (if $minutes % 60 > 0 then " \($minutes % 60)m" else "" end)
      end;

  def bar:
    ([whole, 100] | min | (. * 10 + 50) / 100 | floor) as $filled
    | "▰" * $filled + "▱" * (10 - $filled);

  @sh "
    cwd=\(.workspace.current_dir // .cwd // "")
    model=\(.model.display_name // "")
    effort=\(if .thinking.enabled == true then .effort.level // "" else "" end)
    elapsed=\(.cost.total_duration_ms | duration)
    tokens_used=\(.context_window.total_input_tokens | compact)
    tokens_total=\(.context_window.context_window_size | compact)
    context_bar=\(.context_window.used_percentage | bar)
    cost=\(.cost.total_cost_usd // 0)
    added=\(.cost.total_lines_added | compact)
    removed=\(.cost.total_lines_removed | compact)
    week=\(.rate_limits.seven_day.used_percentage | if . == null then "" else "\(whole)%" end)
  "
')"

branch=$(git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null)

# Runs on every refresh: skip the index lock so it never collides with git commands
if [ -n "$(git --no-optional-locks -C "$cwd" status --porcelain 2>/dev/null)" ]; then
  git_state='✗'
else
  git_state='✓'
fi

paint() { printf '\033[%sm%s\033[0m' "$1" "$2"; }
separator() { paint '38;2;67;76;94' ' | '; }

paint '38;2;143;188;187' "🤖 $model"
separator
paint '38;2;236;239;244' "💪 $effort"
separator
paint '38;2;163;190;140' "🌳 $branch "
paint '38;2;235;203;139' "$git_state"
separator
paint '1;3;38;2;244;5;5;48;2;12;12;12' "⌛ $elapsed"
separator
paint '38;2;255;175;0' "📖 $tokens_used/$tokens_total $context_bar"
separator
paint '38;2;254;89;92' "$(printf '🤑 $%.2f ' "$cost")"
separator
printf '➕ %s ➖ %s ' "$added" "$removed"

# Only subscribers get rate limits, and only after the first API response
if [ -n "$week" ]; then
  separator
  paint '38;2;180;142;173' "📅 7d $week"
fi
