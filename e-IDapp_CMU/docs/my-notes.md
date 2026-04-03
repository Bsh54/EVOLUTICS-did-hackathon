 adb connect 192.168.0.224:39785


## Remove env
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty --tag-name-filter cat -- --all && git push origin --force --all && git push origin --force --tags