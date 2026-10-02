# SDD Skills — Especificación de requisitos

> Resultado de `/sc:brainstorm` · 2026-10-02 · Estado: decisiones cerradas, listo para diseño
> Siguiente paso: `/sc:design` (arquitectura) o `/sc:workflow` (plan de implementación)

## 1. Objetivo

Un paquete de skills de **Spec Driven Development** para Claude Code que guíe a los equipos internos de la organización por un flujo estructurado y repetible:

```
/inicializa → /planifica → /desarrolla → /revisa → /prueba → /documenta
```

Cada fase deja un **artefacto verificable** (historia, plan, código, revisión, pruebas, documentación) y un **informe local**. Si Atlassian está conectado, las historias viven en Jira y la documentación se puede publicar en Confluence.

### Metas medibles
- Toda historia que llega a desarrollo cumple la *Definition of Ready*.
- Todo commit y PR referencia la clave de su historia.
- Ninguna historia se marca como completada sin un checklist de criterios de aceptación verificado.
- Un proyecto nuevo queda operativo con `/inicializa` en menos de 10 minutos.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Agente objetivo | **Solo Claude Code** (formato `SKILL.md` nativo; puede usar subagentes, hooks y MCP) |
| Fuente de verdad de historias | **Jira** cuando está configurado; **fallback a archivos** en el repo (`specs/HU-001.md`) cuando no |
| Workflow de Jira | **Mapeo en `/inicializa`**: lee los estados reales del proyecto y los asocia a *En curso*, *En revisión* y *Hecho* |
| Hosting Git | **Bitbucket Cloud, GitHub, GitLab y Azure DevOps** |
| Estrategia de ramas | **Configurable con presets** (GitFlow, GitHub Flow, trunk-based) |
| Commits | **Conventional Commits con la clave en el scope**: `feat(PROJ-123): añade filtro por fecha` |
| Plan técnico | En el repo, en `.sdd/specs/<ID>/plan.md`, **ignorado por git** |
| Informes | **Siempre locales** en `.sdd/reports/`, **ignorados por git**. **No se publica nada en Jira** |
| Estimación | **Story points Fibonacci** (1, 2, 3, 5, 8, 13); si pasa de 8, se propone dividir |
| DoR / DoD | El paquete **propone un estándar** (sección 6), ajustable por proyecto |
| Documentación | **Markdown en `docs/`** versionado; publicación **opcional en Confluence** |
| Revisión de código | **Informe local + comentarios en el PR tras confirmación** del revisor |
| Autonomía en desarrollo | **Plan técnico aprobado → ejecución** (tests y commits por tarea), parada antes del PR |
| Pruebas e2e | **Exploratoria vía MCP de navegador + generación de tests Playwright** versionados |
| Niveles | **Global y repo**, para instalación y configuración; manda el repo (RF-T10) |
| Distribución | **Plugin de Claude Code** (marketplace en el mismo repo de GitHub) + **paquete npm en GitHub Packages** con CLI (`npx sdd init`) |
| Gobernanza | **Un responsable único** decide los cambios en convenciones y plantillas, y publica las versiones |
| Audiencia | Equipos internos de la org |
| Idioma | Comandos, plantillas e informes **en español** |

## 3. Actores

- **PO / Product Owner**: usa `/planifica`.
- **Desarrollador**: usa `/inicializa`, `/desarrolla`, `/prueba` y `/documenta`.
- **Revisor**: usa `/revisa`.
- **QA** (opcional): usa `/prueba`.
- **Responsable del paquete**: único decisor de las convenciones de la org; publica las versiones.

## 4. Requisitos funcionales transversales

**RF-T1 Configuración por proyecto.** `.sdd/config.yml` (versionado) guarda: tracker (`jira` | `local`), clave del proyecto Jira, `cloudId`, **mapeo de estados y del campo de story points**, espacio de Confluence, hosting Git y repo, preset de ramas, comandos de test (unit, integración, e2e), URL base para e2e, rutas (`specs/`, `docs/`, `.sdd/specs/`, `.sdd/reports/`), Definition of Ready y Definition of Done.

**RF-T2 Degradación elegante.** Cada skill detecta si el MCP de Atlassian está disponible y configurado. Si no lo está, sigue en modo local sin fallar y sin preguntar en cada paso, e indica en el informe qué no se sincronizó.

**RF-T3 Convención de ramas.** El nombre lo determina el preset (p. ej. `feature/PROJ-123-slug-corto`, `bugfix/…`, `hotfix/…`) y se valida antes de crear la rama.

**RF-T4 Convención de commits.** Conventional Commits con la clave de la historia en el scope: `<tipo>(<CLAVE>): <descripción>`. Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.

**RF-T5 Informes locales.** Cada skill genera un informe Markdown en `.sdd/reports/<ID>/<fase>-<fecha>.md` con resumen, hallazgos, recomendaciones y siguientes pasos. **Los informes no se publican en Jira ni se versionan.** La trazabilidad en Jira se limita a la historia y a los vínculos de rama, commits y PR que crea el hosting.

**RF-T6 Archivos locales ignorados.** `/inicializa` comprueba que `.sdd/specs/` y `.sdd/reports/` estén en `.gitignore` y, si faltan, **propone añadirlos** (con confirmación).

**RF-T7 Confirmación de acciones externas.** Crear o editar issues, transicionar estados, publicar comentarios en PRs y publicar en Confluence requiere confirmación explícita.

**RF-T8 Abstracción del hosting Git.** Operaciones comunes (crear PR, leer diff, leer y publicar comentarios, estado de CI) sobre las cuatro plataformas: `gh` (GitHub), `glab` (GitLab), `az repos` (Azure DevOps) y **API REST 2.0 de Bitbucket Cloud** (token de API + email de la cuenta, por variables de entorno).

**RF-T9 Plantillas personalizables.** Plantillas (historia, plan técnico, checklist de revisión, caso e2e, doc técnica, ADR, descripción de PR) con valor por defecto de la org y sobrescribibles por proyecto en `.sdd/templates/` o de forma global en `~/.sdd/templates/`, sin perder las actualizaciones del paquete.

**RF-T10 Dos niveles: repo y global.** La configuración y la instalación pueden ser **globales** (usuario: `~/.sdd/config.yml`, skills en `~/.claude/skills/` o plugin con `--scope user`) o **de repo** (`.sdd/config.yml`, `.claude/skills/` o plugin con `--scope project`). Manda el repo. Sin config de repo, las skills funcionan con la global y sugieren `/inicializa`.

## 5. Requisitos por skill

### 5.1 `/inicializa`
- **RF-I1** Asistente interactivo que detecta el stack (package.json, pom.xml, build.gradle, pyproject…), los comandos de test, el remoto Git y su hosting, y los MCP disponibles.
- **RF-I2** Propone el preset de ramas y la DoR/DoD estándar (sección 6) para aceptarla o ajustarla.
- **RF-I3** Si Atlassian está disponible, lista sitios, proyectos Jira y espacios Confluence; valida permisos; lee el workflow del proyecto y **pide asociar** *En curso*, *En revisión* y *Hecho* a sus estados reales; localiza el campo de story points.
- **RF-I4** Comprueba dependencias opcionales (CLI del hosting, token de Bitbucket, Playwright y su MCP) e indica cómo resolver cada una que falte.
- **RF-I5** Escribe `.sdd/config.yml` y la estructura de carpetas, y aplica RF-T6. Es idempotente: si se vuelve a ejecutar, actualiza en lugar de sobrescribir. Usa la config global como valores propuestos y escribe la del repo completa.
- **RF-I7** `/inicializa --global` crea o edita la config global sin tocar ningún repo.
- **RF-I6** Informe de configuración local: qué está listo, qué falta y qué está degradado.

### 5.2 `/planifica [idea o requerimiento]`
- **RF-P1** Guía al PO en **rondas de refinamiento** (preguntas, propuesta, ajuste) hasta cerrar las historias.
- **RF-P2** Historias con *Como / Quiero / Para*, criterios de aceptación en **Gherkin**, notas, dependencias y **story points Fibonacci sugeridos**.
- **RF-P3** **Validación** contra INVEST y la DoR: criterios testeables, ambigüedad, tamaño y dependencias. Cada historia recibe una puntuación con observaciones.
- **RF-P4** Propone dividir las historias de más de 8 puntos y agruparlas en épica cuando aplique.
- **RF-P5** Con Jira: crea o actualiza la épica, las historias (con story points si el campo está mapeado) y sus vínculos tras confirmación. Sin Jira: escribe `specs/HU-xxx.md`.
- **RF-P6** Informe local de planificación: historias, validación, riesgos y preguntas abiertas para negocio.

### 5.3 `/desarrolla [ID historia]`
- **RF-D1** Lee la historia (de Jira o de `specs/`) y verifica la DoR. Si no la cumple, avisa y sugiere `/planifica`.
- **RF-D2** Analiza el código y genera un **plan técnico** en `.sdd/specs/<ID>/plan.md` (archivos afectados, tareas y mapeo tarea → criterio de aceptación) que el desarrollador debe **aprobar**.
- **RF-D3** Crea la rama según el preset desde la base correcta y, con Jira, transiciona la historia al estado mapeado como *En curso*.
- **RF-D4** Implementa por tareas siguiendo las convenciones del proyecto, con tests unitarios y de integración, y hace commits atómicos según RF-T4.
- **RF-D5** Al terminar ejecuta lint, tests unitarios y de integración. No avanza mientras fallen: intenta corregir y, si no puede, informa.
- **RF-D6** Genera el **checklist de criterios de aceptación y de la DoD** con su evidencia (test, archivo o captura).
- **RF-D7** Si todo está en verde, **ofrece** hacer push y crear el PR (con la plantilla y enlace a la historia) y devuelve su URL. Con Jira, transiciona a *En revisión*.
- **RF-D8** Informe local de desarrollo: cambios, tests, cobertura si existe, deuda técnica y checklist.

### 5.4 `/revisa [ID PR]`
- **RF-R1** Obtiene el PR, su diff, la descripción, el estado de CI y la historia vinculada (por la clave en la rama, el título o los commits).
- **RF-R2** Revisa contra el **checklist de la org**: corrección, cumplimiento de criterios de aceptación, tests, seguridad, rendimiento, legibilidad y convenciones de ramas y commits.
- **RF-R3** Clasifica los hallazgos por severidad (bloqueante, importante, sugerencia, nit) con archivo y línea, y redacta comentarios constructivos.
- **RF-R4** Muestra los comentarios propuestos y un veredicto (aprobar o pedir cambios). **Solo publica en el PR** los que el revisor confirma.
- **RF-R5** Informe local de revisión con la matriz criterio de aceptación → evidencia en el código.

### 5.5 `/prueba [ID historia]`
- **RF-E1** Deriva casos e2e de los criterios de aceptación (uno o más por escenario Gherkin).
- **RF-E2** **Ejecución exploratoria** contra la URL configurada mediante el MCP de navegador disponible (Playwright MCP o Claude in Chrome), con capturas o GIF como evidencia.
- **RF-E3** **Genera tests Playwright** versionados, los ejecuta por CLI y los deja listos para CI.
- **RF-E4** Para cada fallo registra los pasos para reproducirlo, el resultado esperado frente al obtenido y la evidencia. Con Jira, ofrece crear un bug vinculado.
- **RF-E5** Informe local de pruebas: casos, resultados, cobertura de criterios y evidencias.

### 5.6 `/documenta [ID historia]`
- **RF-O1** Identifica qué cambió (diff de la rama o del PR) y qué documentos lo cubren (README, API, ADR, guías, changelog).
- **RF-O2** Crea o actualiza Markdown en `docs/` con las plantillas. El control de versiones lo da git.
- **RF-O3** Detecta documentación obsoleta relacionada con el cambio.
- **RF-O4** Si hay Confluence configurado, publica o actualiza la página tras confirmación y la vincula a la historia.
- **RF-O5** Informe local de documentación: documentos creados o actualizados, huecos y obsolescencias.

## 6. DoR y DoD estándar propuestas

**Definition of Ready** (lo valida `/planifica` y lo comprueba `/desarrolla`):
1. Formato *Como / Quiero / Para* con un valor de negocio claro.
2. Al menos un criterio de aceptación en Gherkin, todos verificables.
3. Cumple INVEST; estimada en ≤ 8 story points.
4. Dependencias identificadas y no bloqueantes.
5. Sin preguntas abiertas para negocio.
6. Diseño o maqueta enlazada si afecta a la UI.

**Definition of Done** (la comprueba el checklist de `/desarrolla`):
1. Todos los criterios de aceptación cumplidos y con evidencia.
2. Lint y tests unitarios y de integración en verde.
3. Tests nuevos para el comportamiento añadido o corregido.
4. Ramas y commits siguen las convenciones.
5. PR creado con descripción y enlace a la historia; revisión aprobada.
6. Criterios con flujo de usuario validados e2e (`/prueba`).
7. Documentación actualizada (`/documenta`).

## 7. Requisitos no funcionales

- **RNF-1 Agnóstico al stack**: funciona en proyectos Java, Node, Python, etc. El canal plugin no requiere Node.
- **RNF-2 Instalación**: `/plugin marketplace add davidmogu/sdd-skills` + `/plugin install --scope user|project`, o `npm i -D @davidmogu/sdd-skills` desde GitHub Packages (`npx sdd init` copia las skills a `.claude/skills/`; con `--global`, a `~/.claude/skills/`).
- **RNF-3 Versionado semántico** y changelog. Las actualizaciones no pisan las plantillas personalizadas del proyecto.
- **RNF-4 Seguridad**: no hay credenciales en `.sdd/config.yml`. Los tokens van por variables de entorno o por la autenticación de cada CLI o MCP, y los informes no incluyen secretos.
- **RNF-5 Idempotencia**: volver a ejecutar una skill sobre el mismo ID actualiza en lugar de duplicar (issues, comentarios de PR, páginas de Confluence).
- **RNF-6 Trazabilidad**: historia → rama → commits → PR, visible en Jira mediante la integración del hosting. Los informes y el plan son locales de cada desarrollador.
- **RNF-7 Eficiencia de contexto**: las skills cargan referencias (plantillas, checklists) bajo demanda. El `SKILL.md` se mantiene breve.
- **RNF-8 Mantenibilidad**: las convenciones de la org están centralizadas en un solo sitio del paquete.

## 8. Historias de usuario del propio paquete (alto nivel)

1. **Como** desarrollador, **quiero** ejecutar `/inicializa` **para** dejar mi proyecto listo para SDD sin configurar a mano.
   - Dado un repo sin `.sdd/`, cuando ejecuto `/inicializa`, entonces se crea `.sdd/config.yml` con el stack, el hosting y el preset detectados.
   - Dado que `.gitignore` no incluye `.sdd/specs/` ni `.sdd/reports/`, cuando termino, entonces se me propone añadirlos.
   - Dado que Atlassian no está conectado, cuando termino, entonces el tracker queda en `local` y el informe lo indica.
2. **Como** PO, **quiero** convertir una idea en historias validadas **para** que el equipo entienda qué construir.
   - Dada una idea, cuando completo las rondas, entonces cada historia tiene criterios Gherkin, story points y su puntuación INVEST.
   - Dado Jira configurado, cuando confirmo, entonces la épica y las historias se crean en el proyecto.
3. **Como** desarrollador, **quiero** implementar una historia con un plan aprobado **para** entregar un PR completo y revisable.
   - Dado un plan aprobado, cuando termina la implementación, entonces todos los tests pasan y cada criterio tiene evidencia.
   - Dado el checklist en verde, cuando acepto, entonces se crea el PR enlazado a la historia, se devuelve su URL y la historia pasa a *En revisión*.
4. **Como** revisor, **quiero** una revisión asistida **para** dar feedback consistente.
   - Dado un ID de PR, cuando ejecuto `/revisa`, entonces veo los hallazgos por severidad y solo se publican en el PR los que apruebo.
5. **Como** QA o desarrollador, **quiero** validar los criterios en el navegador y obtener tests e2e **para** evitar regresiones.
6. **Como** desarrollador, **quiero** documentación actualizada a partir de la historia **para** que no se desfase del código.

## 9. Fuera de alcance (v1)

- Soporte para otros agentes (Cursor, Copilot, Codex).
- Trackers distintos de Jira; Bitbucket Data Center.
- Publicación de informes en Jira.
- Sincronización bidireccional entre Jira y los archivos locales.
- Publicación automática sin confirmación.
- Métricas y dashboards de equipo.

## 10. Pendientes menores

1. ~~Nombre del scope y de la organización~~ → resuelto: `davidmogu/sdd-skills`, `@davidmogu/sdd-skills`.
2. ~~Responsable único~~ → resuelto: @davidmogu.
3. Consecuencia aceptada: como los informes son locales y ignorados, un revisor no ve el informe de desarrollo del autor; la evidencia relevante debe ir en la **descripción del PR** (la plantilla de PR incluirá el checklist de criterios).
