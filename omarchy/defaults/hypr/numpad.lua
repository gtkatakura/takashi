-- Numpad workspace bindings (for 100% keyboards), mirroring Omarchy's SUPER + 1..0 in
-- default/hypr/bindings/tiling.lua. Each workspace has a key for numlock off and on.
local numpad_keys = {
  { "KP_End", "KP_1" },
  { "KP_Down", "KP_2" },
  { "KP_Next", "KP_3" },
  { "KP_Left", "KP_4" },
  { "KP_Begin", "KP_5" },
  { "KP_Right", "KP_6" },
  { "KP_Home", "KP_7" },
  { "KP_Up", "KP_8" },
  { "KP_Prior", "KP_9" },
  { "KP_Insert", "KP_0" },
}

for workspace, keys in ipairs(numpad_keys) do
  local ws = tostring(workspace)

  for _, key in ipairs(keys) do
    o.bind("SUPER + " .. key, "Switch to workspace " .. ws .. " (numpad)", hl.dsp.focus({ workspace = ws }))
    o.bind("SUPER + SHIFT + " .. key, "Move window to workspace " .. ws .. " (numpad)", hl.dsp.window.move({ workspace = ws }))
    o.bind("SUPER + SHIFT + ALT + " .. key, "Move window silently to workspace " .. ws .. " (numpad)", hl.dsp.window.move({ workspace = ws, follow = false }))
  end
end
