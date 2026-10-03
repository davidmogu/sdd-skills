#!/bin/bash
# Historia local HU-001 que cumple la DoR (2 escenarios).
set -euo pipefail
mkdir -p specs
cat > specs/HU-001.md <<'H'
---
id: HU-001
tipo: historia
titulo: Filtrar pedidos por rango de fechas de envío
estado: por_hacer
puntos: 2
epica:
dependencias: []
enlaces: []
creada: 2026-10-01
actualizada: 2026-10-01
---

**Como** responsable de almacén
**quiero** filtrar los pedidos por un rango de fechas de envío
**para** preparar solo los envíos de esos días.

## Criterios de aceptación

```gherkin
Escenario: Rango válido
  Dado pedidos con fecha "2026-10-01" y "2026-10-03"
  Cuando filtro desde "2026-10-01" hasta "2026-10-02"
  Entonces obtengo solo el pedido con fecha "2026-10-01"

Escenario: Rango invertido
  Cuando filtro desde "2026-10-05" hasta "2026-10-01"
  Entonces se lanza un error con el mensaje "La fecha inicial debe ser anterior a la final"
```

## Notas

- Las fechas son cadenas ISO (AAAA-MM-DD). Función nueva `filtrarPorFecha(pedidos, desde, hasta)` en `src/pedidos.js`.
- Diseño: no aplica (función de dominio sin UI).
H
git add specs && git commit -q -m "docs(HU-001): historia"
