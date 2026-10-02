---
name: inicializa
description: Configura SDD en el repo actual (.sdd/config.yml completa, .gitignore, Jira opcional) o, con --global, la configuración personal en ~/.sdd/config.yml.
argument-hint: "[--global]"
disable-model-invocation: true
---

# /inicializa

Deja el proyecto listo para el flujo SDD: detecta el stack, el hosting y las convenciones, opcionalmente conecta Jira, y escribe una configuración **completa** y compartible. Con `--global`, prepara la configuración personal que sirve de valores propuestos para todos los repos.

Argumentos recibidos: `$ARGUMENTS`

- Si contienen `--global` → sigue **Modo global** (al final).
- En otro caso → sigue **Modo repo**.

---

## Modo repo

### 1. Arranque

Sigue `referencias/protocolo-comun.md` con estas **excepciones**:
- **No** exijas config de repo: `/inicializa` es quien la crea.
- La config global y los defaults se usan solo como **valores propuestos**.
- Si `<repo>/.sdd/config.yml` ya existe, cárgala: es una **reconfiguración** (paso 7, diff).

### 2. Detectar

Recoge sin preguntar todavía:

1. **Remoto y hosting:** `git remote -v`. Elige `origin` o, si no existe, el único remoto. Obtén `git.hosting` y `git.repo` con la tabla de `referencias/contratos/git-host.md`. Si no hay remotos, deja `hosting` vacío y avísalo.
2. **Preset de ramas:** si existe `develop` (`git branch -a --list '*develop'`), propón `gitflow` con base `develop`; si no, `github-flow` con base `main` (o la rama por defecto: `git symbolic-ref refs/remotes/origin/HEAD`).
3. **Stack y comandos:** sigue `referencias/deteccion-stack.md`.
4. **Convenciones existentes:** `CONTRIBUTING.md`, `commitlint.config.*`, `.husky/` o un `.editorconfig`. Si alguno contradice las convenciones SDD, anótalo para mostrarlo.
5. **MCP disponibles:** Atlassian (como en el protocolo, §3) y navegador (herramientas con `playwright` o `claude-in-chrome` en el nombre).

### 3. Proponer y ajustar

Muestra **una tabla** con lo detectado y su origen (detectado / global / defecto):

| Clave | Valor propuesto | Origen |
|---|---|---|
| hosting / repo | … | detectado |
| preset · base | … | … |
| lint · test_unit · test_integracion · test_e2e | … | … |
| e2e.url_base | … | … |
| tracker | local / jira | … |

Pregunta (con la herramienta de preguntas, en una sola tanda si es posible):
- **Tracker:** `local` o `jira`. Ofrece `jira` solo si el MCP de Atlassian está disponible; si no lo está, explica que puede configurarse después volviendo a ejecutar `/inicializa`.
- **Preset de ramas**, si hay dudas.
- **Comandos** que no se pudieron detectar o que son ambiguos (monorepo, varios scripts posibles).
- **DoR/DoD:** usar las propuestas (de la global o del estándar en `referencias/convenciones/dor-dod.md`) o editarlas.

### 4. Jira (solo si el tracker es `jira`)

Sigue `referencias/atlassian.md`: sitio y proyecto, tipos de issue, mapeo de estados, campo de story points, espacio de Confluence opcional y comprobación de la integración hosting↔Jira.

### 5. Dependencias

Sigue `referencias/dependencias.md` y prepara la tabla de estado (ok / falta / cómo resolverlo). No instales nada sin `⏸`.

### 6. Componer la config

Parte de `referencias/config/config-repo.yml` (estructura y orden de claves) y rellena **todas** las claves con los valores acordados. La config del repo debe ser **materializada**:
- No dejes claves "heredadas" de la global: escribe su valor.
- Elimina los comentarios de ejemplo que no apliquen (p. ej. el bloque `jira` si el tracker es `local`).
- Los comandos que no existan quedan como `""`.

Comprueba tú mismo, antes de escribir, que los valores cumplen lo esperado:
- `hosting` ∈ {github, gitlab, azure, bitbucket-cloud}.
- `preset` ∈ {gitflow, github-flow, trunk}.
- Las rutas son relativas y terminan en `/`.
- `tracker.jira.proyecto` va en mayúsculas.
- Los patrones de rama y de commit contienen `{clave}`.

### 7. Confirmar y escribir `⏸`

- **Config nueva:** muestra el YAML completo.
- **Reconfiguración:** muestra solo el **diff** respecto a la actual. Si el usuario no cambió nada, no escribas.

Pide confirmación para cada cambio (o en bloque si el usuario lo prefiere):

1. `<repo>/.sdd/config.yml`
2. `<repo>/.sdd/templates/README.md`, si no existe: explica que una plantilla `<x>.md` en esa carpeta sustituye a la del paquete y que en `~/.sdd/templates/` se pueden poner las personales.
3. `.gitignore`: añade las líneas que falten bajo un comentario `# SDD (local, no versionar)`:
   ```
   .sdd/specs/
   .sdd/reports/
   ```
   Si `.gitignore` ignora `.sdd/` entero, avisa: la config y las plantillas **deben** versionarse. Propón cambiarlo por las dos líneas anteriores.

### 8. Ofrecer config global

Si **no existe** config global, ofrece (`⏸`) guardar en `~/.sdd/config.yml` las elecciones compartibles: `idioma`, `tracker.tipo`, `tracker.jira.{cloudId,sitio,tipos}`, `confluence.espacio`, `git.ramas.preset` y `dor`/`dod` si se editaron. Nunca guardes claves solo de repo.

### 9. Commit opcional `⏸`

Ofrece hacer commit de `.sdd/config.yml`, `.sdd/templates/README.md` y `.gitignore` con:

```
chore(sdd): configura Spec Driven Development
```

Este commit no lleva clave de historia: es la única excepción a `referencias/convenciones/commits.md`. No hagas push.

### 10. Informe

Genera el informe (`referencias/informe.md`, ID `_init`, fase `inicializa`) con:
- La tabla de configuración final y su origen.
- La tabla de dependencias.
- Las convenciones en conflicto detectadas.
- **Siguientes pasos:** `/planifica <idea>`, y lo que falte instalar o autenticar.

---

## Modo global

No requiere estar en un repo ni toca ningún repo.

1. Lee `$SDD_HOME/config.yml` o `~/.sdd/config.yml` si existe (reconfiguración → diff).
2. Pregunta solo por las claves globales: `idioma`, tracker por defecto (`local`/`jira`), y además:
   - Si es `jira` y el MCP está disponible: sitio (`cloudId`, `sitio`) y tipos de issue, según `referencias/atlassian.md` §1–2, **sin** proyecto ni estados.
   - Espacio de Confluence por defecto.
   - Preset de ramas.
   - DoR/DoD de la organización.
3. Compón el fichero a partir de `referencias/config/config-global.yml`, sin claves solo de repo.
4. `⏸` Escribe `~/.sdd/config.yml` y crea `~/.sdd/templates/` si no existe.
5. Informe en `~/.sdd/reports/_init/inicializa-global-<fecha>.md`, o en el repo si estás dentro de uno.
6. Siguiente paso sugerido: `/inicializa` dentro de cada repo.

## Referencias bajo demanda

| Cargar | Cuando |
|---|---|
| `referencias/protocolo-comun.md` | Siempre, al empezar |
| `referencias/deteccion-stack.md` | Paso 2.3 |
| `referencias/atlassian.md` | Tracker `jira` o modo global con Jira |
| `referencias/dependencias.md` | Paso 5 |
| `referencias/config/*.yml` | Paso 6 / modo global |
| `referencias/convenciones/dor-dod.md` | Al proponer DoR/DoD |
| `referencias/contratos/git-host.md` | Detección del hosting |
| `referencias/informe.md` | Paso 10 |
