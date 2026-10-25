-- US (index 0) for code and US International (index 1) for text, toggled with Alt+Space.
-- kb_options keeps Omarchy's defaults from default/hypr/input.lua.
hl.config({
  input = {
    kb_layout = "us,us",
    kb_variant = ",intl",
    kb_options = "compose:caps,shift:both_capslock_cancel,grp:alt_space_toggle",
  },
})
