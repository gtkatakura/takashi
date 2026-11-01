Each account runs its own Flatpak Steam side by side, with no sudo and no extra install. `labs` is the default Flatpak Steam; the others live in `~/.steam-accounts/<name>`.

```bash
steam-account jarvis                  # open the account's Steam
steam-account jarvis -applaunch 322330 # launch a game by app id
steam-account jarvis -shutdown        # close it cleanly
```

`steam-account` only opens accounts that exist; with no name or an unknown one it shows the usage and the accounts.

While a game runs on an account, its Steam ignores arguments such as `-applaunch` and `steam://` links. `steam-account <name>` with no arguments still opens the window, through the account's tray icon.

Manage accounts. `add` creates the folder and the launcher entry; the first launch downloads ~2.5 GB of Steam, then log in with "remember me". `remove` deletes the account's folder, with its installed games, and its launcher entry:

```bash
steam-account list
steam-account add friday
steam-account remove friday
```

Copy a game between accounts without downloading it (btrfs only, the target account needs the license and its Steam closed; the first launch still fetches the Steam Linux Runtimes):

```bash
from=~/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps
to=~/.steam-accounts/jarvis/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps
mkdir -p "$to/common"
cp -a --reflink=always "$from/common/Don't Starve Together" "$to/common/"
cp "$from/appmanifest_322330.acf" "$to/"
```
