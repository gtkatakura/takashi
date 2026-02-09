#!/bin/bash

git config --global alias.ln '!sh -c "git config --global \"alias.$1\" \"$2\""'
git ln aliases 'config --get-regexp alias'
git ln st status
git ln branch-name 'rev-parse --abbrev-ref HEAD'
git ln upstream-name '!git for-each-ref --format=%\(upstream:short\) \$(git symbolic-ref -q HEAD)'
git ln last 'log --date=iso8601 --stat -1'
git ln ls 'log --pretty=format:\"%C(yellow)%h %C(reset)%s%C(blue) [%cn]%C(red)%d\"'
git ln ldr 'log --pretty=format:\"%C(yellow)%h %ad %C(reset)%s%C(blue) [%cn]%C(red)%d\" --date=relative'
git ln ld 'log --pretty=format:\"%C(yellow)%h (%ad) %C(reset)%s%C(blue) [%cn]%C(red)%d\" --date=iso8601'
git ln tree '!git ls --graph'
git ln amend 'commit --amend -C HEAD'
git ln undo 'reset HEAD~1'
git ln publish '!git push -u origin \$(git branch-name)'
git ln unpublish '!git push origin :\$(git branch-name)'
