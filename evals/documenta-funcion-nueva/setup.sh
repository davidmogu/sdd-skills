#!/bin/bash
# Scaffold de la eval: se ejecuta en el workspace vacío (cwd).
set -euo pipefail
source "$(dirname "$0")/../_comun/repo-node.sh"
source "$(dirname "$0")/../_comun/config-local.sh"
source "$(dirname "$0")/../_comun/historia-hu001.sh"
printf '# Tienda\n\n## API de dominio\n\n- `filtrarPorEstado(pedidos, estado)`: pedidos en un estado.\n' > README.md
git add README.md && git commit -q -m "docs: readme"
git switch -q -c feature/HU-001-filtrar-pedidos-fecha
cat >> src/pedidos.js <<'J'

export function filtrarPorFecha(pedidos, desde, hasta) {
  if (desde > hasta) throw new Error('La fecha inicial debe ser anterior a la final');
  return pedidos.filter((p) => p.fecha >= desde && p.fecha <= hasta);
}
J
git commit -qam "feat(HU-001): añade filtro de pedidos por rango de fechas"
