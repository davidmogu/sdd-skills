# Adaptador de tracker: Jira (MCP de Atlassian)

> Verificado el 2026-10-03 contra un proyecto team-managed real (las 8 operaciones del contrato).

Modo `jira`. Las historias viven en Jira, que es la fuente de verdad. Usa las herramientas del MCP de Atlassian. Su prefijo depende de la instalación (p. ej. `mcp__atlassian__…`): búscalas por nombre de operación y cárgalas con la búsqueda de herramientas si están diferidas.

- **Herramientas directas:** `getJiraIssue`, `searchJiraIssuesUsingJql`, `createJiraIssue`, `editJiraIssue`, `transitionJiraIssue`.
- **Operaciones vía `executeRead` / `executeWrite`** (con `name`, `cloudId` en el nivel superior e `inputs`): `listJiraIssueTransitions`, `createJiraIssueLink`, `listJiraIssueRemoteIssueLinks`, `createJiraIssueRemoteIssueLink`, `listJiraIssueLinkTypes`, `listJiraProjects`, `listJiraProjectIssueTypesMetadata`, `getJiraIssueTypeMetaWithFields`, `listJiraStatuses`. Si alguna no existe con ese nombre, usa `discover` describiendo el objetivo. **No inventes nombres.**
- Pasa siempre `cloudId` = `tracker.jira.cloudId`.

## Descripción de la historia en Jira

Jira no tiene campos para el enunciado ni para los criterios, así que van en la **descripción, en Markdown** (`contentFormat: markdown`; el MCP la convierte a ADF) con esta estructura fija, para poder leerla de vuelta:

````markdown
**Como** responsable de almacén
**quiero** filtrar los pedidos por fecha de envío
**para** preparar solo los envíos del día.

## Criterios de aceptación

```gherkin
Escenario: Filtro por un rango válido
  Dado …
  Cuando …
  Entonces …
```

## Notas

…

---
_Creada con /planifica (SDD)._
````

Al leer, las listas pueden volver con `*` en lugar de `-`: es equivalente.

**Al leer** una historia que no siga la estructura (escrita a mano en Jira), extrae lo que puedas. Si no hay criterios en Gherkin, trátalo como *DoR-2 no cumplida*; no inventes los criterios.

## Operaciones

| Operación | Cómo |
|---|---|
| `obtenerHistoria(id)` | `getJiraIssue` con `issueIdOrKey`, `view: "evidence"` (incluye enlaces y campos personalizados) y `responseContentFormat: "markdown"`. Mapea: `summary` → `titulo`, `issuetype.name` → `tipo` (según `tracker.jira.tipos`), `status` → estado lógico (tabla abajo), `parent.key` → `epica`, enlaces *Blocks* entrantes → `dependencias`, campo `tracker.jira.campos.story_points` → `puntos` (llega en `fields.customFields["<nombre del campo>"]`, con `id` y `value`: busca la entrada cuyo `id` sea el configurado), `https://<sitio>/browse/<id>` → `url` |
| `buscarHistorias(filtro)` | `searchJiraIssuesUsingJql` con `project = <proyecto>` y, según el filtro: `AND parent = <epica>`, `AND status = "<nombre>"`, `AND summary ~ "<texto>"`; `issuetype = "<tipos.historia>"`. Usa `maxResults` ≤ 50 y pagina con `nextPageToken` |
| `crearEpica(datos)` | `createJiraIssue` con `projectKey`, `issueType: tipos.epica`, `summary` y `description` (objetivo y lista de historias) |
| `crearHistoria(datos)` | Antes, `buscarHistorias({texto: titulo})` para evitar duplicados. `createJiraIssue` con `projectKey`, `issueType: tipos.historia`, `summary`, `description` (estructura de arriba), `parent: <epica>` y, si `campos.story_points` no es nulo, `additional_fields: { "<customfield>": <puntos> }`. Las **dependencias** se crean después con `createJiraIssueLink` (`linkType: "Blocks"`, `inwardIssue: <dependencia>`, `outwardIssue: <nueva>`) |
| `actualizarHistoria(id, cambios)` | `editJiraIssue` con `fields` (`summary`, `description`) y `additional_fields` para los puntos. La respuesta no devuelve los campos personalizados: si necesitas confirmar los puntos, léelos con `searchJiraIssuesUsingJql` (`key = <id>`, `fields: [<customfield>]`). Si la descripción original contiene medios o paneles (llega en HTML), edita con `contentFormat: "html"` para no perderlos |
| `transicionar(id, estado)` | 1) `estado` → destino = `tracker.jira.estados.<estado>`. Si no hay mapeo, **no transiciones** (contrato, §Errores). 2) Si el estado actual ya es el destino, termina. 3) `listJiraIssueTransitions` → elige la transición cuyo **estado destino** coincide con el mapeado, no la que se llama igual. La respuesta trae `to.name` y `to.statusCategory` pero **no** `to.id`: compara por `to.name` con `estados.<estado>.nombre`. 4) `transitionJiraIssue` con ese `transitionId`. Si ninguna transición lleva al destino desde el estado actual, informa de las disponibles y no fuerces |
| `vincular(id, enlace)` | **`tipo: pr` → no hace nada** (D10): el PR aparece en el panel *Desarrollo* de la issue gracias a la integración del hosting, siempre que la clave esté en la rama, los commits y el título del PR. **Otros tipos** (`doc`, `diseno`…) → `listJiraIssueRemoteIssueLinks` para no duplicar (la misma URL dos veces crea dos enlaces y no se pueden borrar) y, si no existe, `createJiraIssueRemoteIssueLink` con `url` y `title` (`⏸`) |
| `crearBug(datos)` | `createJiraIssue` con `issueType: tipos.bug` y una descripción con *Pasos para reproducir*, *Resultado esperado*, *Resultado obtenido* y *Evidencias*. Después, `createJiraIssueLink` con `linkType: "Relates"` hacia la historia |

## Estado de Jira → estado lógico

| Condición | Estado lógico |
|---|---|
| Coincide con `estados.en_curso` | `en_curso` |
| Coincide con `estados.en_revision` | `en_revision` |
| Coincide con `estados.hecho` o la categoría del estado es *done* | `hecho` |
| Categoría *new* (To Do / Por hacer) | `por_hacer` |
| Otra categoría *indeterminate* sin mapeo | `en_curso` (anótalo como aviso) |

## Errores frecuentes

| Respuesta | Acción |
|---|---|
| Campo obligatorio ausente al crear (con `repairHint` / `allowedValues`) | Pregunta al usuario el valor, sin inventarlo, y reintenta una vez |
| `issueType` no válido en el proyecto | `listJiraProjectIssueTypesMetadata` y sugiere volver a ejecutar `/inicializa` para corregir `tracker.jira.tipos` |
| 401/403 | Sin permiso: informa; el modo pasa a `local-degradado` para el resto de la ejecución |
| Enlaces entre issues desactivados en el sitio | Anota las dependencias en la descripción y avísalo |
