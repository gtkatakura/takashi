# Example: offline data for a Relay app

- **Compatibility:** `react-relay-offline` needed React ≤18 and Relay 20; the project was on React 19 and Relay 21. The same author's framework-free core, `@wora/relay-offline`, fit.
- **Capabilities checked, one PASS/FAIL each:** persisted read with no request; optimistic update; rollback on a transport error; rollback on a business error; offline queue; flush on reconnect.
- **Workarounds the spike revealed:**
  - `@wora/netinfo` ignores the browser's `online`/`offline` events in Chrome, so they had to be bridged by hand.
  - Rejected queued mutations must be rolled back by hand from the backup.
