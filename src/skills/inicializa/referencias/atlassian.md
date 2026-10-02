# Configurar Jira y Confluence en /inicializa

Solo lectura en Atlassian: `/inicializa` **no crea ni modifica** nada en Jira ni en Confluence. Las operaciones que no son herramientas directas se ejecutan con `executeRead` (`name`, `cloudId` en el nivel superior, `inputs`). Si un nombre no existe, usa `discover`.

## 1. Sitio

`getAccessibleAtlassianResources`:
- Un solo sitio con Jira → úsalo.
- Varios → pregunta cuál.
- Si la global ya tiene `tracker.jira.cloudId` y sigue en la lista → propónlo.

Guarda `cloudId` y `sitio` (la `url`).

## 2. Proyecto y tipos de issue

1. `listJiraProjects` con `action: "create"` y `expand: "issueTypes"`: proyectos en los que el usuario puede crear issues. Si hay muchos, pide un filtro (`query`). Pregunta cuál usar. En **modo global** salta este paso.
2. Tipos (`listJiraProjectIssueTypesMetadata`, o los del `expand` anterior): propón el mapeo y confírmalo:
   - `epica` → `Epic` / `Épica`
   - `historia` → `Story` / `Historia`; si no existe, `Task` / `Tarea`, y avísalo
   - `bug` → `Bug` / `Error`

## 3. Estados (solo modo repo)

`listJiraStatuses` con `mode: "project"`, `projectKey` e `issueType: <tipos.historia>`. Muestra los estados con su categoría y propón:

| Estado lógico | Propuesta |
|---|---|
| `en_curso` | El primero de categoría *indeterminate* (p. ej. *In Progress* / *En curso*) |
| `en_revision` | Un estado *indeterminate* cuyo nombre contenga *review*, *revisión* o *QA*; si no hay, déjalo sin mapear y avisa (las skills no transicionarán a revisión) |
| `hecho` | El de categoría *done* (*Done* / *Hecho*). Solo se usa para leer: ninguna skill transiciona a *hecho* (D4) |

Guarda `{nombre, id}` de cada uno. **No** guardes IDs de transición: dependen de cada issue y se resuelven al transicionar.

## 4. Story points

`getJiraIssueTypeMetaWithFields` con el `issueTypeId` de la historia y `requiredFieldsOnly: false`. Busca un campo numérico llamado *Story Points*, *Story point estimate* o *Puntos de historia*:
- Si lo encuentras → `campos.story_points: <customfield_xxxxx>`.
- Si no → `null`, y avisa de que los puntos irán solo en la descripción.

## 5. Confluence (opcional)

Pregunta si se usará Confluence para la documentación. Si se usa:
- `listConfluenceSpaces` (vía `executeRead`; si el nombre no existe, `discover` "list confluence spaces") → elegir espacio.
- Página padre opcional: pide su URL o título y obtén el ID con `getConfluenceContent` o con una búsqueda.

## 6. Integración hosting ↔ Jira (D10)

`searchJiraIssuesUsingJql` con

```
project = <proyecto> AND development[pullrequests].all > 0
```

y `searchResultMode: "count"`.

- **> 0** → la integración funciona.
- **0** → puede que falte la integración o que aún no haya PRs. Avisa: *"Para que los PRs aparezcan en las historias, activa la integración de <hosting> con Jira (GitHub for Jira, Bitbucket, GitLab for Jira o Azure DevOps for Jira) y usa la clave en las ramas, los commits y el título del PR. Las skills SDD ya lo hacen."*
- Error de JQL (función no disponible) → trátalo como *desconocido* y da el mismo aviso.
