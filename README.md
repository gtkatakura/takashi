# Takashi Development Environment

A comprehensive development environment setup for Omarchy and macOS, providing a curated collection of tools and applications for modern software development.

## Quick Start

One command for every machine. It detects the system and runs that system's setup:

```bash
bash <(curl -fsSL setup.gtkatakura.com/install.sh)
```

| System | Before running |
| --- | --- |
| Omarchy (Arch Linux) | [Omarchy](https://omarchy.org/) 4 or later must be installed |
| macOS | Nothing: Homebrew is installed when it is missing |

`TAKASHI_REF=<branch>` in front of the command installs from a branch, for example to test a PR before it is merged.

## What's Included

### Web Browsers

- **Brave Browser** - Privacy-focused browser with built-in ad blocking
- **Google Chrome** (macOS) - Popular web browser by Google
- **Firefox** (macOS) - Open-source browser by Mozilla

### Code Editors & IDEs

- **Cursor** - AI-powered code editor built on VS Code
- **Orca** (Omarchy) - Agent development environment for running coding agents in parallel
- **Visual Studio Code** (macOS) - Popular code editor by Microsoft
- **Vim** - Command-line text editor
- **Android Studio** - Official IDE for Android development
- **JetBrains Toolbox** - Application launcher for JetBrains IDEs

### Terminal Tools & Utilities

- **AWS CLI** - Command line interface for Amazon Web Services
- **GitHub CLI (gh)** - Command line tool for GitHub
- **jq** - Command-line JSON processor
- **yq** - Command-line YAML processor
- **Hyperfine** - Command-line benchmarking tool
- **Pastel** - Command-line tool to generate, analyze and manipulate colors
- **Heroku CLI** - Command line interface for Heroku platform
- **grpcurl** - Tool for interacting with gRPC servers
- **mkcert** - Create locally-trusted development certificates
- **Comby** - Structural code search and replace tool
- **Watchman** - File watching service by Facebook
- **eza** (macOS) - Modern replacement for ls
- **zoxide** (macOS) - Smart cd command that learns your habits
- **mise** (macOS) - Runtime version manager
- **gnupg** (macOS) - GNU Privacy Guard
- **lazygit** (macOS) - Terminal UI for git commands
- **lazydocker** (macOS) - Terminal UI for docker commands

### Charm.sh CLI Tools

- **freeze** - Generate images of code and terminal output
- **glow** - Terminal markdown renderer
- **mods** - AI for the command line
- **sequin** - Generate sequences
- **vhs** - Generate terminal recordings

### Database Tools

- **DBeaver Community** - Universal database tool and SQL client

### Communication & Collaboration

- **Discord** - Voice and text communication platform
- **Slack** - Team communication and collaboration platform
- **Zoom** (macOS) - Video conferencing software

### Productivity & Note-taking

- **HyprMac** (macOS) - Tiling window manager in the style of Hyprland: automatic layout, ten workspaces, keyboard-first
- **Raycast** (macOS) - Productivity tool and launcher
- **SuperWhisper** (macOS) - Voice-to-text transcription tool
- **Obsidian** (macOS) - Knowledge base and note-taking app
- **Notion** (macOS) - All-in-one workspace for notes and collaboration
- **Figma** (macOS) - Collaborative design tool
- **Spotify** (macOS, Omarchy) - Music streaming service

### Development & API Tools

- **Postman** - API development and testing platform

### Containerization & Virtualization

- **Docker** - Container platform
- **Docker Compose** - Multi-container Docker applications
- **OrbStack** (macOS) - Fast container and Linux VM runner for macOS
- **VirtualBox** - Virtualization software
- **QuickEmu** - Quickly create and run virtual machines
- **QEMU/KVM** - Virtualization tools for Android emulation

### Mobile Development

- **Android Platform Tools** (macOS) - ADB and other Android development tools
- **Vysor** - View and control Android devices
- **Expo Orbit** (macOS) - Launch builds and manage simulators

### AI & ML

- **Coding agents** (macOS) - Claude Code, Codex, Antigravity CLI, pi, oh-my-pi and opencode, installed through mise at their latest version (Omarchy ships them the same way and gets Antigravity CLI from `omarchy/install/terminal/app-antigravity.sh`)
- **LM Studio** - Desktop app for running local language models
- **Agent skills** (Omarchy) - Skills for opencode and Claude Code (PR shipping, reviews, library spikes, research studies, parity studies of a challenger against the tool it wants to replace, refactoring, evidence before claiming done, before and after proof of a change) plus pinned third-party skills; opencode also gets slash commands, `reviewer` and `frontend` agents (Figma, Chrome DevTools and Playwright MCP) and global instructions, all kept in `shared/defaults/agents`

### Gaming

- **Steam** (Omarchy) - Flatpak Steam, one instance per account side by side, managed with `steam-account`, each with its own launcher entry ([cheat sheet](cheat-sheets/steam.md))

### Security & VPN

- **AWS VPN Client** (macOS) - Client for AWS Client VPN endpoints
- **1Password CLI** (macOS) - Command line interface for 1Password

### System Configuration

- **Git aliases** - Predefined shortcuts for common git commands
- **Shell aliases** - git, docker, Cursor (`c`), Claude Code without permission prompts (`cc`) and more
- **Claude Code status line** - Model, effort, git state, session time, context, cost and lines changed, kept in `shared/defaults/claude/statusline.sh`
- **Antigravity CLI status line** - Model, running subagents, effort, git state, context, cost, lines changed and weekly quota, kept in `shared/defaults/antigravity/statusline.sh`
- **CLI telemetry opt-out** - Disables telemetry, error reporting and session sharing across Antigravity CLI, Claude Code, Codex, OpenCode, pi, Copilot CLI and `gh` (`shared/install/terminal/set-agent-telemetry.sh` and `shared/defaults/bash/telemetry.sh`)
- **Keyboard layouts** - US and US International with Alt+Space switching (`kc` / `kt` to pick one)
- **Numpad workspaces** (Omarchy) - Super + numpad switches workspaces, with Shift / Shift+Alt to move windows
- **Rosetta 2** (macOS) - Translation layer for x86 apps on Apple Silicon
- **Dependency-download guards** - see below

## Dependency-download guards

Use **Bun** for JavaScript and **uv** for Python. npm, pnpm, pip and Bundler are set up too, for
third-party projects that need them.

`shared/install/terminal/set-supply-chain.sh` protects every package download against compromised
releases, typosquats and install-script payloads. It only sets each tool's own settings: there is
no proxy, no shell alias and no wrapper script, so `bun run`, `bun test` and `python3` cost
nothing extra.

| Guard | Setting | Covers |
|---|---|---|
| 7-day cooldown | Bun `minimumReleaseAge`, npm `min-release-age`, pnpm `minimumReleaseAge`, uv `exclude-newer`, mise `minimum_release_age`, Bundler `cooldown` (4.0.13+) | Bun, bunx, npm, pnpm 10 and 11+, uv, every mise tool |
| Socket malware scanner, pinned in `shared/defaults/bun-security-scanner` | Bun `[install.security] scanner`, aube `securityScanner` | `bun install`/`add`, `bunx`, mise `npm:` tools, in any shell, IDE or agent |
| No unapproved install scripts | Bun and pnpm defaults, npm `strict-allow-scripts`, mise `allow_builds` | postinstall payloads |
| No stray pip installs | `PIP_REQUIRE_VIRTUALENV=1` | pip in third-party projects |
| Provenance | mise `paranoid = ["provenance"]`, plus its default attestation, SLSA and cosign checks | binaries installed by mise |
| No self-updates | claude, codex, copilot, agy, opencode and grok settings | agent CLIs change only through `mise upgrade`, after the cooldown |

The scanner fails closed. Offline, or with the Socket API down, `bun install` stops. It costs about
+0.3 s per `bun install` and +2 s per mise `npm:` install. Inside a project that pins Node below
22.6, mise `npm:` installs fail, so install those tools from `~`.

### When the scanner stops an install

Bun resolves the whole dependency tree, then hands every package and version to the scanner before it
downloads anything. The scanner asks Socket about each one and answers with an advisory per flagged
package:

| Level | What Bun does |
|---|---|
| `fatal` | Stops the install and exits non-zero. `package.json`, the lockfile and `node_modules` stay as they were. |
| `warn` | Asks whether to continue in a terminal. In CI it stops. |

A package Socket knows as malware comes back `fatal`. This is the real output for
`bun add safe-chain-test`, a test package kept for that purpose:

```text
⚠ Socket Security Scanner free mode. Set SOCKET_API_TOKEN to use your Socket org settings.

  FATAL: pkg:npm/safe-chain-test@0.0.1-security

Package has been removed from the npm registry due to security concerns.
This is a placeholder package published by the npm security team to prevent malicious usage of the package name.
The original package likely contained harmful code.

Fix: Remove this package and either replace with a verified alternative from a trusted source or revert to a known-safe previous version.

    https://socket.dev/npm/package/safe-chain-test/overview/0.0.1-security

1 advisory (1 fatal)
Installation aborted due to fatal security advisories
```

- `pkg:npm/<name>@<version>` names the package, which can be a dependency deep in the tree rather
  than the one you asked for. `bun why <name>` shows who pulls it in.
- The link opens Socket's page for that version, with the alerts and the code it found.
- The first line only says no Socket token is set. Free mode still blocks known malware.

The same block from mise, for an `npm:` tool, reads
`aube install failed: refusing to install package(s) flagged by securityScanner = …`, followed by
the same package, description and link.

What to do:

1. Read the Socket page. If the package is malware, drop it. If it came in as a dependency, update or
   replace the package that pulls it in.
2. If the alert is about one version only, pin a version Socket does not flag.
3. If you are sure it is a false positive, turn the scanner off for that one install, as for offline
   work below, and turn it back on right after.

A "Security scanner failed" error is different: the scanner could not reach Socket, so nothing was
checked and the install stopped anyway.

- **Check it**: in an empty directory, `bun add safe-chain-test` must stop with the output above.
- **Offline**: comment out the `[install.security]` lines in `~/.config/.bunfig.toml` (Bun) or
  set `securityScanner = ""` in `~/.config/aube/config.toml` (mise). The cooldown stays.
- **Scanner updates**: the scanner is pinned by version and `bun.lock` hash. Bump it on purpose a
  few times a year: change `package.json` there, run `bun install`, then rerun the installer.
- **Urgent fix younger than 7 days**: exempt just that package with `minimumReleaseAgeExcludes`
  (Bun), `min-release-age-exclude` (npm), `minimumReleaseAgeExclude` (pnpm),
  `exclude-newer-package` (uv) or `minimum_release_age_excludes` (mise).
- **Private registries**: the free scanner sends each package name and version to Socket. Use
  `socket login` for an organisation token, or turn the scanner off as for offline work.
- **Not covered**: Go modules (no cooldown exists; `GOSUMDB` stays on), and Bundler before 4.0.13.

## Manual Setup

After installation, complete the setup with tasks in [MANUAL_SETUP.md](MANUAL_SETUP.md):

1. **Brave Sync** - Sync browser settings and bookmarks
2. **VSCode Settings Sync** - Sync editor preferences and extensions
3. **1Password for Git** - Set up SSH key management ([Tutorial](https://developer.1password.com/docs/ssh/manage-keys/))
4. **Git Credentials** - Authenticate with GitHub (`gh auth login`), then install gh-dash on Omarchy
5. **File Watcher Limits** - Increase system file watcher limits for development
6. **Steam Accounts** (Omarchy) - Add each account with `steam-account add <name>` and log in once, with "remember me"
7. **Figma MCP** (Omarchy) - Sign in once with `opencode mcp auth figma`
8. **HyprMac** (macOS) - Grant the Accessibility permission on first launch and keep Caps Lock as Caps Lock in the Modifier Keys settings

## Platform Differences

### Omarchy Features

- Arch Linux with Hyprland compositor (Omarchy 4+)
- Packages via Omarchy's `omarchy-pkg-add` / `omarchy-pkg-aur-add` (pacman, the `[omarchy]` repo and AUR), preferring prebuilt packages
- Keyboard layouts and numpad bindings as Lua files loaded from Hyprland's `input.lua` / `bindings.lua`
- Layers on top of Omarchy's defaults (starship prompt, ghostty terminal, Discord webapp, etc.)
- Many tools already provided by Omarchy (bat, eza, fzf, zoxide, lazygit, docker, mise, and Claude Code, Codex and gh via mise)

### macOS Features

- Comprehensive Homebrew-based installations
- Tiling windows and workspaces like the Omarchy desktop (HyprMac)
- Enhanced productivity tools (Raycast, SuperWhisper)
- Full office and creative suite support
- Advanced terminal tools (eza, zoxide, lazygit, lazydocker)

## Project Structure

```
takashi/
├── omarchy/         # Omarchy (Arch Linux) setup
├── macbook/         # macOS-specific setup
├── shared/          # Cross-platform configurations
└── cheat-sheets/    # Reference documentation
```

The project provides a complete development environment setup optimized for web development, mobile development (React Native/Android), and modern DevOps workflows.
