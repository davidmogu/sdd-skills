#!/bin/bash
# Scaffold de la eval: se ejecuta en el workspace vacío (cwd).
set -euo pipefail
source "$(dirname "$0")/../_comun/repo-node.sh"
git remote add origin https://github.com/eval/tienda.git
source "$(dirname "$0")/../_comun/config-local.sh"
printf '# MARCA-INTACTA\n' >> .sdd/config.yml && git commit -qam "marca"
