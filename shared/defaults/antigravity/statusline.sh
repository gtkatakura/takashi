#!/usr/bin/env bash
# Antigravity CLI status line: agy pipes the session as JSON to stdin and shows what this prints.
# Mirrors shared/defaults/claude/statusline.sh for the Antigravity CLI payload schema.

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

  def bar:
    ([whole, 100] | min | (. * 10 + 50) / 100 | floor) as $filled
    | "▰" * $filled + "▱" * (10 - $filled);

  def weekly_used:
    (.quota // {})
    | (
        ."gemini-weekly"
        // (to_entries | map(select(.key | test("weekly"; "i"))) | first | .value)
        // (to_entries | min_by(.value.remaining_fraction) | .value)
      )
    | .remaining_fraction
    | if . == null then ""
      else "\(([0, ([100, (((1 - .) * 100) | round)] | min)] | max))%"
      end;

  @sh "
    cwd=\(.workspace.current_dir // .cwd // "")
    model=\(.model.display_name // "")
    effort=\(.model.effort // "")
    subagents=\([(.subagents // [])[] | select(.status == "running") | (.name // .role // "subagent")] | group_by(.) | map("\(length)×\(.[0])") | join(" "))
    tokens_used=\(.context_window.total_input_tokens | compact)
    tokens_total=\(.context_window.context_window_size | compact)
    context_bar=\(.context_window.used_percentage | bar)
    cost=\(.cost.total_usd // "")
    week=\(weekly_used)
  "
')"

branch=$(git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null)

# Runs on every refresh: skip the index lock so it never collides with git commands
if [ -n "$(git --no-optional-locks -C "$cwd" status --porcelain 2>/dev/null)" ]; then
  git_state='✗'
else
  git_state='✓'
fi

# Antigravity does not report session line counts in its payload; use uncommitted diff against HEAD
compact_num() {
  awk -v n="${1:-0}" 'BEGIN {
    n = int(n)
    if (n < 1000) printf "%d", n
    else if (n < 1000000) printf "%.1fk", int(n / 100) / 10
    else printf "%.1fM", int(n / 100000) / 10
  }' | sed 's/\.0\([kM]\)$/\1/'
}

added_raw=0
removed_raw=0
if [ -n "$branch" ]; then
  read -r added_raw removed_raw < <(
    git --no-optional-locks -C "$cwd" diff --numstat HEAD 2>/dev/null \
      | awk '$1 ~ /^[0-9]+$/ { a += $1; d += $2 } END { printf "%d %d\n", a + 0, d + 0 }'
  )
fi
added=$(compact_num "$added_raw")
removed=$(compact_num "$removed_raw")

paint() { printf '\033[%sm%s\033[0m' "$1" "$2"; }
separator() { paint '38;2;67;76;94' ' | '; }

paint '38;2;143;188;187' "🤖 $model"
if [ -n "$subagents" ]; then
  separator
  paint '38;2;136;192;208' "🧩 $subagents"
fi
if [ -n "$effort" ]; then
  separator
  paint '38;2;236;239;244' "💪 $effort"
fi
separator
paint '38;2;163;190;140' "🌳 $branch "
paint '38;2;235;203;139' "$git_state"
separator
paint '38;2;255;175;0' "📖 $tokens_used/$tokens_total $context_bar"
if [ -n "$cost" ]; then
  separator
  paint '38;2;254;89;92' "$(printf '🤑 $%.2f ' "$cost")"
fi
separator
printf '➕ %s ➖ %s ' "$added" "$removed"

if [ -n "$week" ]; then
  separator
  paint '38;2;180;142;173' "📅 7d $week"
fi
