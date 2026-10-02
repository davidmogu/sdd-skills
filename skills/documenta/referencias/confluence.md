# Publicar en Confluence

El repo es la fuente de verdad; Confluence es una **copia publicada** para quien no lee el repo. Herramientas del MCP de Atlassian (prefijo según la instalación; cárgalas si están diferidas). Pasa siempre `cloudId` = `tracker.jira.cloudId` (el sitio es el mismo).

## Pasos

1. **Formato:** antes de escribir, consulta la guía de formato con `executeRead`, `name: getContentFormatGuide` e `inputs: { toolName: "createConfluencePage" }` (o `updateConfluencePage` si vas a actualizar). Sigue sus indicaciones para el cuerpo (Markdown o HTML).
2. **Instrucciones del espacio:** `executeRead` con `name: getConfluenceSpace` e `inputs: { spaceIdOrKey: <confluence.espacio> }`. Aplica las `spaceInstructions` si las hay.
3. **¿Existe ya la página?** `searchConfluence` por el **título exacto** dentro del espacio. Título: el `#` del documento, con el prefijo de la clave si es documentación de historia (`HU-007 · Filtro de pedidos por fecha`) o el nombre del documento si es general (README, guía).
4. **Crear o actualizar:**
   - No existe → `createConfluenceContent` (página) en el espacio, con padre `confluence.pagina_padre` si está configurado.
   - Existe → `getConfluenceContent` para leer la versión actual y `updateConfluenceContent` con el contenido nuevo. Si la página se editó a mano en Confluence, con contenido que no está en el repo, **no lo pises**: muestra la diferencia y pregunta.
5. Añade al final de la página: *"Publicado desde `<ruta en el repo>` con /documenta. La fuente de verdad es el repositorio."*
6. **Vincular** con la historia: `vincular(<ID>, { tipo: doc, url: <url de la página>, titulo })` (adaptador del tracker).

## Errores

| Situación | Acción |
|---|---|
| Sin permiso de escritura en el espacio | Informa; la documentación queda en el repo |
| `pagina_padre` no existe | Crea la página en la raíz del espacio y avisa de que hay que corregir la config |
| El MCP no responde | Anótalo en *Sin sincronizar*; no reintentes en bucle |
