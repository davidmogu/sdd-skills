#!/bin/bash
# Scaffold de la eval: se ejecuta en el workspace vacío (cwd).
set -euo pipefail
source "$(dirname "$0")/../_comun/repo-node.sh"
source "$(dirname "$0")/../_comun/config-local.sh"
mkdir -p specs docs
printf -- '---\nid: HU-003\ntipo: historia\ntitulo: Renombrar variable de entorno de la tienda\nestado: en_revision\ndependencias: []\nenlaces: []\ncreada: 2026-10-01\nactualizada: 2026-10-01\n---\n\n**Como** operador **quiero** que la variable se llame TIENDA_ZONA_HORARIA **para** unificar nombres.\n' > specs/HU-003.md
printf 'export const zona = process.env.TZ_TIENDA ?? "Europe/Madrid";\n' > src/config.js
printf '# Configuración\n\n| Variable | Descripción |\n|---|---|\n| `TZ_TIENDA` | Zona horaria de la tienda |\n' > docs/configuracion.md
git add -A && git commit -q -m "chore: config"
git switch -q -c chore/HU-003-renombrar-variable
printf 'export const zona = process.env.TIENDA_ZONA_HORARIA ?? "Europe/Madrid";\n' > src/config.js
git commit -qam "refactor(HU-003): renombra TZ_TIENDA a TIENDA_ZONA_HORARIA"
