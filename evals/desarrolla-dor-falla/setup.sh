#!/bin/bash
# Scaffold de la eval: se ejecuta en el workspace vacío (cwd).
set -euo pipefail
source "$(dirname "$0")/../_comun/repo-node.sh"
source "$(dirname "$0")/../_comun/config-local.sh"
source "$(dirname "$0")/../_comun/historia-sin-dor.sh"
