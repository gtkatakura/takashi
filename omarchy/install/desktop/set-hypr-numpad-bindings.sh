#!/bin/bash

BINDINGS_FILE="$HOME/.config/hypr/bindings.conf"

if grep -q "# Numpad workspace switching" "$BINDINGS_FILE" 2>/dev/null; then
  green_text "Numpad workspace bindings already configured — skipping"
  return 0
fi

green_text "Adding numpad workspace bindings to Hyprland"

cat >> "$BINDINGS_FILE" << 'EOF'

# Numpad workspace switching (for 100% keyboards with numpad)
# numlock OFF: KP_End/Down/Next/Left/Begin/Right/Home/Up/Prior/Insert
bindd = SUPER, KP_End,    Switch to workspace 1 (numpad), workspace, 1
bindd = SUPER, KP_Down,   Switch to workspace 2 (numpad), workspace, 2
bindd = SUPER, KP_Next,   Switch to workspace 3 (numpad), workspace, 3
bindd = SUPER, KP_Left,   Switch to workspace 4 (numpad), workspace, 4
bindd = SUPER, KP_Begin,  Switch to workspace 5 (numpad), workspace, 5
bindd = SUPER, KP_Right,  Switch to workspace 6 (numpad), workspace, 6
bindd = SUPER, KP_Home,   Switch to workspace 7 (numpad), workspace, 7
bindd = SUPER, KP_Up,     Switch to workspace 8 (numpad), workspace, 8
bindd = SUPER, KP_Prior,  Switch to workspace 9 (numpad), workspace, 9
bindd = SUPER, KP_Insert, Switch to workspace 10 (numpad), workspace, 10

# numlock ON: KP_1..KP_9, KP_0
bindd = SUPER, KP_1, Switch to workspace 1 (numpad numlock), workspace, 1
bindd = SUPER, KP_2, Switch to workspace 2 (numpad numlock), workspace, 2
bindd = SUPER, KP_3, Switch to workspace 3 (numpad numlock), workspace, 3
bindd = SUPER, KP_4, Switch to workspace 4 (numpad numlock), workspace, 4
bindd = SUPER, KP_5, Switch to workspace 5 (numpad numlock), workspace, 5
bindd = SUPER, KP_6, Switch to workspace 6 (numpad numlock), workspace, 6
bindd = SUPER, KP_7, Switch to workspace 7 (numpad numlock), workspace, 7
bindd = SUPER, KP_8, Switch to workspace 8 (numpad numlock), workspace, 8
bindd = SUPER, KP_9, Switch to workspace 9 (numpad numlock), workspace, 9
bindd = SUPER, KP_0, Switch to workspace 10 (numpad numlock), workspace, 10

bindd = SUPER SHIFT, KP_End,    Move window to workspace 1 (numpad), movetoworkspace, 1
bindd = SUPER SHIFT, KP_Down,   Move window to workspace 2 (numpad), movetoworkspace, 2
bindd = SUPER SHIFT, KP_Next,   Move window to workspace 3 (numpad), movetoworkspace, 3
bindd = SUPER SHIFT, KP_Left,   Move window to workspace 4 (numpad), movetoworkspace, 4
bindd = SUPER SHIFT, KP_Begin,  Move window to workspace 5 (numpad), movetoworkspace, 5
bindd = SUPER SHIFT, KP_Right,  Move window to workspace 6 (numpad), movetoworkspace, 6
bindd = SUPER SHIFT, KP_Home,   Move window to workspace 7 (numpad), movetoworkspace, 7
bindd = SUPER SHIFT, KP_Up,     Move window to workspace 8 (numpad), movetoworkspace, 8
bindd = SUPER SHIFT, KP_Prior,  Move window to workspace 9 (numpad), movetoworkspace, 9
bindd = SUPER SHIFT, KP_Insert, Move window to workspace 10 (numpad), movetoworkspace, 10

bindd = SUPER SHIFT, KP_1, Move window to workspace 1 (numpad numlock), movetoworkspace, 1
bindd = SUPER SHIFT, KP_2, Move window to workspace 2 (numpad numlock), movetoworkspace, 2
bindd = SUPER SHIFT, KP_3, Move window to workspace 3 (numpad numlock), movetoworkspace, 3
bindd = SUPER SHIFT, KP_4, Move window to workspace 4 (numpad numlock), movetoworkspace, 4
bindd = SUPER SHIFT, KP_5, Move window to workspace 5 (numpad numlock), movetoworkspace, 5
bindd = SUPER SHIFT, KP_6, Move window to workspace 6 (numpad numlock), movetoworkspace, 6
bindd = SUPER SHIFT, KP_7, Move window to workspace 7 (numpad numlock), movetoworkspace, 7
bindd = SUPER SHIFT, KP_8, Move window to workspace 8 (numpad numlock), movetoworkspace, 8
bindd = SUPER SHIFT, KP_9, Move window to workspace 9 (numpad numlock), movetoworkspace, 9
bindd = SUPER SHIFT, KP_0, Move window to workspace 10 (numpad numlock), movetoworkspace, 10

bindd = SUPER SHIFT ALT, KP_End,    Move window silently to workspace 1 (numpad), movetoworkspacesilent, 1
bindd = SUPER SHIFT ALT, KP_Down,   Move window silently to workspace 2 (numpad), movetoworkspacesilent, 2
bindd = SUPER SHIFT ALT, KP_Next,   Move window silently to workspace 3 (numpad), movetoworkspacesilent, 3
bindd = SUPER SHIFT ALT, KP_Left,   Move window silently to workspace 4 (numpad), movetoworkspacesilent, 4
bindd = SUPER SHIFT ALT, KP_Begin,  Move window silently to workspace 5 (numpad), movetoworkspacesilent, 5
bindd = SUPER SHIFT ALT, KP_Right,  Move window silently to workspace 6 (numpad), movetoworkspacesilent, 6
bindd = SUPER SHIFT ALT, KP_Home,   Move window silently to workspace 7 (numpad), movetoworkspacesilent, 7
bindd = SUPER SHIFT ALT, KP_Up,     Move window silently to workspace 8 (numpad), movetoworkspacesilent, 8
bindd = SUPER SHIFT ALT, KP_Prior,  Move window silently to workspace 9 (numpad), movetoworkspacesilent, 9
bindd = SUPER SHIFT ALT, KP_Insert, Move window silently to workspace 10 (numpad), movetoworkspacesilent, 10

bindd = SUPER SHIFT ALT, KP_1, Move window silently to workspace 1 (numpad numlock), movetoworkspacesilent, 1
bindd = SUPER SHIFT ALT, KP_2, Move window silently to workspace 2 (numpad numlock), movetoworkspacesilent, 2
bindd = SUPER SHIFT ALT, KP_3, Move window silently to workspace 3 (numpad numlock), movetoworkspacesilent, 3
bindd = SUPER SHIFT ALT, KP_4, Move window silently to workspace 4 (numpad numlock), movetoworkspacesilent, 4
bindd = SUPER SHIFT ALT, KP_5, Move window silently to workspace 5 (numpad numlock), movetoworkspacesilent, 5
bindd = SUPER SHIFT ALT, KP_6, Move window silently to workspace 6 (numpad numlock), movetoworkspacesilent, 6
bindd = SUPER SHIFT ALT, KP_7, Move window silently to workspace 7 (numpad numlock), movetoworkspacesilent, 7
bindd = SUPER SHIFT ALT, KP_8, Move window silently to workspace 8 (numpad numlock), movetoworkspacesilent, 8
bindd = SUPER SHIFT ALT, KP_9, Move window silently to workspace 9 (numpad numlock), movetoworkspacesilent, 9
bindd = SUPER SHIFT ALT, KP_0, Move window silently to workspace 10 (numpad numlock), movetoworkspacesilent, 10
EOF
