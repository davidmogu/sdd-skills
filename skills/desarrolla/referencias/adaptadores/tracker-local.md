# Adaptador de tracker: local (ficheros en el repo)

Se usa en los modos `local` y `local-degradado`. Las historias son ficheros Markdown **versionados** en `<repo>/<tracker.local.ruta>` (por defecto `specs/`). A diferencia de `.sdd/specs/`, esta carpeta **no** se ignora en git: es la fuente de verdad del equipo.

> En modo `local-degradado` (proyecto con Jira y MCP caído) **no crees** historias locales nuevas: duplicarían las de Jira. Usa este adaptador solo para leer lo que ya exista en local.

## Ficheros

| Tipo | Nombre | Ejemplo |
|---|---|---|
| Épica | `<prefijo>-<n>.md` con `tipo: epica` | `specs/HU-002.md` |
| Historia | `<prefijo>-<n>.md` | `specs/HU-007.md` |
| Bug | `BUG-<n>.md` | `specs/BUG-003.md` |

- `<prefijo>` = `tracker.local.prefijo` (por defecto `HU`). Épicas e historias comparten numeración.
- `<n>` con **al menos 3 dígitos**, rellenando con ceros: `HU-001` … `HU-999`, y después `HU-1000`.

## Formato

````markdown
---
id: HU-007
tipo: historia                # epica | historia | bug
titulo: Filtrar pedidos por fecha
estado: por_hacer             # por_hacer | en_curso | en_revision | hecho
puntos: 3
epica: HU-002
dependencias: []
enlaces: []                   # - { tipo: pr, url: https://… }
creada: 2026-10-02
actualizada: 2026-10-02
---

**Como** responsable de almacén
**quiero** filtrar los pedidos por fecha de envío
**para** preparar solo los envíos del día.

## Criterios de aceptación

```gherkin
Escenario: Filtro por un rango válido
  Dado que hay pedidos con envío el 1 y el 3 de octubre
  Cuando filtro del 1 al 2 de octubre
  Entonces solo veo los pedidos con envío el 1 de octubre
```

## Notas

Reglas de negocio, fuera de alcance, enlaces a diseño.
````

Una **épica** lleva `## Objetivo` y `## Historias` (lista de claves) en lugar del enunciado y los criterios. Un **bug** lleva `## Pasos para reproducir`, `## Resultado esperado`, `## Resultado obtenido` y `## Evidencias`, más `historia: HU-007` en el frontmatter.

## Operaciones

| Operación | Cómo |
|---|---|
| `obtenerHistoria(id)` | Lee `<ruta>/<id>.md`. Si no existe, busca sin distinguir mayúsculas; si sigue sin aparecer, error *"historia no encontrada"* |
| `buscarHistorias(filtro)` | Lee el frontmatter de `<ruta>/*.md` y filtra por `epica`, `estado` o un `texto` en el título |
| `crearEpica` / `crearHistoria(datos)` | 1) Busca duplicados por título parecido. 2) Siguiente ID: el mayor valor numérico de `<n>` en `<ruta>/<prefijo>-*.md` + 1 (1 si no hay ninguno), con 3 dígitos como mínimo. 3) Escribe el fichero con `estado: por_hacer` y las fechas de hoy. 4) Si tiene `epica`, añade la clave a `## Historias` de la épica |
| `actualizarHistoria(id, cambios)` | Reescribe solo los campos indicados y actualiza `actualizada` |
| `transicionar(id, estado)` | Cambia `estado:` en el frontmatter y actualiza `actualizada` |
| `vincular(id, enlace)` | Añade `{tipo, url}` a `enlaces:` si no estaba |
| `crearBug(datos)` | Igual que `crearHistoria`, con el prefijo `BUG` y su propia numeración |

- `url` de una historia local = ruta relativa al repo (`specs/HU-007.md`).
- Los cambios en `specs/` son cambios del repo: van en commits normales (p. ej. `docs(HU-007): actualiza estado` o dentro del commit de la tarea). **No** hagas commit sin que la skill lo indique.
- No borres historias. Si se descarta una, el usuario la marca a mano.
