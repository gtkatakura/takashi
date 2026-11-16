# Cases where answering from memory was wrong

Real cases from past reviews. Each was settled only by reading the installed source or running a scratch script.

- **Bun and Node report `fetch` failures differently** (error class and message), so error handling tested under one runtime can miss the other.
- **Apollo ignores the query string on POST** requests; parameters sent that way never reach the resolver.
- **Which error classes `jose` throws** depends on the version and the failure (expired, malformed, bad signature); check the installed `node_modules/jose` before matching on them.
- **"Both halves are green"**: the web app passed against a fake API and the API passed against scripts, yet the real pair failed after a contract change. Only the end-to-end run caught it.
