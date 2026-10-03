# Guía de uso

Skills de **Spec Driven Development** para Claude Code: un flujo estructurado desde la idea hasta la documentación, con Jira opcional.

```
/inicializa → /planifica → /desarrolla → /revisa → /prueba → /documenta
```

## 1. Instalación

Elige **un** canal y **un** alcance. Si instalas por dos vías, los nombres de las skills chocarán (`sdd doctor` lo detecta).

### Como plugin de Claude Code (cualquier stack)

```
/plugin marketplace add davidmogu/sdd-skills
/plugin install sdd@sdd-skills --scope project     # para todo el equipo (se guarda en .claude/settings.json)
/plugin install sdd@sdd-skills --scope user        # solo para ti, en todos tus repos
```

Actualizar: `/plugin marketplace update sdd-skills`.

### Como paquete npm (proyectos Node)

El paquete está en GitHub Packages. Añade al `.npmrc` del proyecto, o al de tu usuario:

```
@davidmogu:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` es un token personal de GitHub con permiso `read:packages`. Defínelo en tu entorno; **no** lo escribas en el `.npmrc` versionado. GitHub Packages exige autenticación incluso para paquetes públicos.

```bash
npm i -D @davidmogu/sdd-skills
npx sdd init            # copia las skills a .claude/skills/ (haz commit para compartirlas con el equipo)
npx sdd init --global   # o en ~/.claude/skills/, solo para ti
npx sdd update          # actualizar sin pisar lo que hayas modificado
npx sdd doctor          # diagnóstico
```

### Invocación

Las skills se invocan con su nombre: `/planifica`. Si otra skill instalada se llama igual, usa la forma del plugin: `/sdd:planifica`. Claude **no** las activa por su cuenta: solo cuando tú las invocas.

## 2. Primeros pasos

```text
/inicializa --global      # opcional: tus valores por defecto (sitio Jira, preset de ramas, DoR/DoD)
/inicializa               # en cada repo: crea .sdd/config.yml y lo deja listo
/planifica Los del almacén necesitan ver solo los pedidos que tienen que enviar hoy
/desarrolla HU-007
/revisa 12
/prueba HU-007
/documenta HU-007
```

## 3. Qué hace cada skill

| Skill | Para quién | Resultado | Escribe fuera del repo |
|---|---|---|---|
| `/inicializa [--global]` | Dev | `.sdd/config.yml` completa y `.gitignore` | No (solo lee Jira) |
| `/planifica <idea>` | PO | Épica e historias con Gherkin, puntos e INVEST/DoR validados | Jira (con confirmación) |
| `/desarrolla <ID>` | Dev | Plan aprobado, rama, commits con tests, checklist y PR | Push, PR y transiciones (con confirmación) |
| `/revisa <PR>` | Revisor | Hallazgos por severidad y veredicto | Solo los comentarios que apruebes |
| `/prueba <ID>` | QA / Dev | Ejecución en navegador, tests Playwright y bugs | Bugs en Jira (con confirmación) |
| `/documenta <ID>` | Dev | `docs/` actualizada y documentación obsoleta detectada | Confluence (opcional, con confirmación) |

Cada ejecución deja un **informe local** en `.sdd/reports/<ID>/`. No se versiona ni se publica en Jira.

## 4. Configuración

Dos niveles, y **manda el del repo**:

| Nivel | Fichero | Se versiona | Para qué |
|---|---|---|---|
| Repo | `.sdd/config.yml` | Sí | Todo lo del proyecto, compartido con el equipo |
| Global | `~/.sdd/config.yml` (o `$SDD_HOME/config.yml`) | No | Tus valores por defecto |

- `/inicializa` escribe la config del repo **completa**: un compañero sin tu config global obtiene el mismo comportamiento.
- Sin config de repo, las skills funcionan con la global y detectan lo demás, pero te recomiendan `/inicializa`.
- Hay claves que solo tienen sentido en el repo (hosting, comandos de test, proyecto Jira, estados): en la global se ignoran.
- `npx sdd doctor` muestra la config efectiva y de qué nivel sale cada valor.

Referencia comentada de todas las claves: [`src/shared/config/config-repo.yml`](../src/shared/config/config-repo.yml).

### Credenciales

Nunca en los ficheros de configuración:

| Servicio | Cómo se autentica |
|---|---|
| GitHub | `gh auth login` |
| GitLab | `glab auth login` |
| Azure DevOps | `az login` + extensión `azure-devops` |
| Bitbucket Cloud | Variables `BITBUCKET_EMAIL` y `BITBUCKET_API_TOKEN` en tu perfil del shell |
| Jira / Confluence | MCP de Atlassian conectado en Claude Code (`/mcp`) |

## 5. Personalizar plantillas

Pon un fichero con el mismo nombre que la plantilla del paquete en:

1. `.sdd/templates/` (del repo, para el equipo), o
2. `~/.sdd/templates/` (personal).

Ejemplo: `.sdd/templates/pr.md` sustituye la descripción de PR de `/desarrolla`. Plantillas disponibles: `historia.md`, `epica.md`, `plan.md`, `pr.md`, `comentario.md`, `resumen-revision.md`, `caso-e2e.md`, `bug.md`, `test-playwright.spec.ts`, `doc-tecnica.md`, `adr.md` y `changelog.md`.

No edites las skills instaladas: `sdd update` conserva tus cambios, pero dejarás de recibir mejoras en esos ficheros.

## 6. Convenciones

- **Ramas:** `{tipo}/{clave}-{slug}`, p. ej. `feature/PROJ-123-filtrar-pedidos-fecha`. Preset `gitflow`, `github-flow` o `trunk`.
- **Commits:** `feat(PROJ-123): añade filtro por rango de fechas` (Conventional Commits con la clave en el scope).
- **Jira:** con la integración de tu hosting activa, el PR aparece solo en la historia porque la clave va en la rama, los commits y el título.

## 7. Preguntas frecuentes

**¿Funciona sin Jira?** Sí. Las historias se guardan en `specs/HU-001.md` dentro del repo.

**¿Qué pasa si el MCP de Atlassian se cae a mitad?** Las skills que leen siguen funcionando. Las que escriben en Jira se detienen y te preguntan, para no crear historias duplicadas en local.

**¿Una skill puede cerrar la historia?** No. El paso a *Hecho* depende del merge y lo hace una persona o una automatización de Jira.

**¿Por qué no veo el informe en el PR?** Los informes son locales. Lo importante (el checklist de criterios con su evidencia) va en la descripción del PR.

**¿Gasta mucho?** Cada skill es una sesión normal de Claude Code. `/revisa` solo lanza subagentes en paralelo cuando el PR supera las 400 líneas cambiadas (configurable en `revision.umbral_subagentes`).
