#!/bin/bash
# Config SDD de repo en modo local (sin Jira ni remoto).
set -euo pipefail
mkdir -p .sdd
cat > .sdd/config.yml <<'Y'
version: 1
idioma: es
tracker:
  tipo: local
  local: { prefijo: HU, ruta: specs/ }
git:
  hosting: github
  remoto: origin
  repo: eval/tienda
  ramas: { preset: github-flow, base: main, patron: "{tipo}/{clave}-{slug}", tipos: [feature, bugfix, hotfix, chore] }
  commits: { patron: "{tipo}({clave}): {descripcion}" }
comandos: { lint: "npm run lint", test_unit: "npm test", test_integracion: "", test_e2e: "" }
e2e: { url_base: "http://localhost:59999", ruta_tests: e2e/, navegador_mcp: auto }
rutas: { docs: docs/, specs_locales: .sdd/specs/, informes: .sdd/reports/, plantillas: .sdd/templates/ }
planificacion: { max_rondas: 3, max_puntos: 8 }
revision: { umbral_subagentes: 400 }
desarrollo: { max_intentos_correccion: 3 }
Y
git add .sdd/config.yml && git commit -q -m "chore(sdd): configura Spec Driven Development"
