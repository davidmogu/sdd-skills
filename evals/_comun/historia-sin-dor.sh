#!/bin/bash
# Historia local HU-002 que NO cumple la DoR (sin enunciado ni criterios).
set -euo pipefail
mkdir -p specs
cat > specs/HU-002.md <<'H'
---
id: HU-002
tipo: historia
titulo: Mejorar el listado
estado: por_hacer
dependencias: []
enlaces: []
creada: 2026-10-01
actualizada: 2026-10-01
---

Hay que mejorar el listado para que vaya mejor.
H
git add specs && git commit -q -m "docs(HU-002): historia"
