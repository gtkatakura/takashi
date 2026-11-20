# Proving a screen

One script drives a real browser on both sides. Clicking through each side by hand does not put both in the same state, and a pair taken at two window sizes or with two different records shows the difference between the runs, not the change.

## The script

- In `$PROOF_RUN/scripts`, with its own `package.json` and the browser library installed there (a file outside the repository does not see the repository's `node_modules`). Check the installed version's API before relying on an option.
- Reads the side's address from the environment (`proof env`), writes every image and video into `$PROOF_OUT`.
- Fixed window (1440 by 900 unless the promise is about another size), animations off, fonts loaded, tours and overlays closed, the same seeded data on both sides.
- Signs in inside the script. Each side runs in its own process, so sessions do not mix; a cookie still belongs to a host, not a port (see `api.md`).
- Collects console errors and failed requests and prints them at the end. They are evidence in every screen method.
- Headless by default. A visible window only when the owner wants to watch, and it must never take keyboard focus from a person working on the machine.
- Look at every image before keeping it: no e-mail address, no sign-in code, no token.

## Which method

Ask the owner when more than one fits.

- **Screenshot pair**: a static change. The cheapest, and enough when the reader only has to see it. One promise per screen (`--as image --file <name>.png`), `changed`, with `--assert` saying what to look at.
- **Visual diff**: when the promise is "only this changed" or "nothing changed": a CSS refactor, a design system or library upgrade, a sweep of many screens. `--expect same` on the screens that must not move, always with `--self`. Mask what moves (clocks, ids, avatars) in the script's screenshot call. Skip it when the change is large and obvious, or when what moves cannot be masked.
- **E2E with video**: behaviour over time: a flow of several steps, a toast, a stream, a loading state, drag, focus. Record the video and a trace into `$PROOF_OUT`. The verdict comes from the script's assertions (`--as exit`); the video is for the reader.
- **E2E with assertions**: the flow matters, the timing does not. Named steps, a screenshot after each. The best candidate to become a permanent test.
- **Size and theme matrix**: the layout changed. Loop sizes and themes in the script and name the files after them (`list-mobile-dark.png`); declare a promise for each one that matters.
- **Accessibility**: markup or interaction changed. Print the scan's violation ids, sorted, per side: `same` for "no new violation", `changed` with `--gone` for a fix. Add a keyboard walk when focus order is the promise.

```sh
proof claim list-screen --text "The list shows the due date under each item" --surface screen \
  --method "screenshot pair" --where "/items" --expect changed --as image \
  --assert "a due date line under each item's name"
proof pair list-screen --self --file list.png -- 'bun "$PROOF_RUN/scripts/shots.ts"'
```

## A screen the base cannot reach

When the feature does not exist before the change, the base still gets the same steps: the script records what the screen shows at the point where it cannot go on and exits non-zero. Declare it `--as exit --exit-base 1 --exit-change 0`. The run does not abort, and the report shows both.

## Reading the verdict

- `changed` on an image means the pixels differ. It does not mean they differ in the way promised: that is what `--assert` tells the reader to check, and why you look at the pair yourself before reporting.
- `not-proven` because the base differs from itself: something on the screen moves. Mask it and run again.
