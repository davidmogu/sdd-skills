#!/bin/bash
# Scaffold de la eval: se ejecuta en el workspace vacío (cwd).
set -euo pipefail
source "$(dirname "$0")/../_comun/repo-node.sh"
node -e 'const p=require("./package.json");p.scripts["test:e2e"]="playwright test";p.devDependencies={"vite":"^5.0.0"};require("fs").writeFileSync("package.json",JSON.stringify(p,null,2))'
printf "export default { use: { baseURL: 'http://localhost:5173' }, testDir: 'e2e' };\n" > playwright.config.js
printf 'node_modules/\n' > .gitignore
git remote add origin https://github.com/eval/tienda.git
git add -A && git commit -q -m "chore: e2e"
