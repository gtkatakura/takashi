Each account runs its own Flatpak Steam side by side, with no sudo and no extra install. `labs` is the default Flatpak Steam; the others live in `~/.steam-accounts/<name>`.

```bash
steam-account jarvis                  # open the account's Steam
steam-account jarvis -applaunch 322330 # launch a game by app id
steam-account jarvis -shutdown        # close it cleanly
```

Add an account: `steam-account <name>` (the first launch downloads ~2.5 GB of Steam), log in with "remember me", then add it to the account list in `omarchy/install/desktop/app-steam.sh` and re-run it for its launcher entry:

```bash
source ~/.local/share/takashi/shared/defaults/bash/utils.sh
source ~/.local/share/takashi/omarchy/install/desktop/app-steam.sh
```

Copy a game between accounts without downloading it (btrfs only, the target account needs the license and its Steam closed; the first launch still fetches the Steam Linux Runtimes):

```bash
from=~/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps
to=~/.steam-accounts/jarvis/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps
mkdir -p "$to/common"
cp -a --reflink=always "$from/common/Don't Starve Together" "$to/common/"
cp "$from/appmanifest_322330.acf" "$to/"
```
