#!/bin/bash
# Scaffold de la eval: se ejecuta en el workspace vacío (cwd).
set -euo pipefail
source "$(dirname "$0")/../_comun/repo-node.sh"
git remote add origin https://github.com/eval/repo-que-no-existe-sdd.git
source "$(dirname "$0")/../_comun/config-local.sh"
