# Mapa documental: tipo de cambio → documento

| Señal en el diff | Documento | Acción |
|---|---|---|
| Endpoint nuevo o modificado (rutas, controladores, OpenAPI, GraphQL) | Doc de API (`docs/api/…`, o la especificación OpenAPI si existe) | Documentar método, ruta, parámetros, respuestas y errores, con un ejemplo de petición y respuesta |
| Cambio visible para el usuario (nueva funcionalidad, mensaje, comportamiento) | `CHANGELOG.md`, sección *Sin publicar* | Entrada en *Añadido*, *Cambiado*, *Corregido* o *Eliminado* con la clave de la historia |
| Decisión técnica relevante: tecnología nueva, patrón, alternativa descartada con impacto (en el plan, *Decisiones*) | ADR en `docs/adr/NNNN-<slug>.md` | Nuevo ADR (`plantillas/adr.md`). Si sustituye a otro, márcalo como *Sustituido por* |
| Variable de entorno, flag o fichero de configuración nuevo | `README` (configuración) o `docs/configuracion.md` | Nombre, propósito, valor por defecto y ejemplo |
| Comando, script o paso de instalación o ejecución nuevo | `README` (uso o desarrollo) | Instrucciones paso a paso |
| Módulo o componente nuevo con lógica no trivial | `docs/<area>/<modulo>.md` (`plantillas/doc-tecnica.md`) | Propósito, cómo encaja, flujo principal y decisiones |
| Migración de datos o cambio incompatible | `CHANGELOG.md` (con **BREAKING**) y guía de actualización | Pasos para actualizar |
| Solo refactor o tests, sin cambio de comportamiento | — | Normalmente nada; como mucho, actualizar la doc técnica si cambió la estructura |

## Criterios

- **Mínimo suficiente:** no documentes por documentar. Cada documento creado o tocado debe responder a una señal del diff.
- **Una sola fuente:** si la información ya vive en un sitio (p. ej. OpenAPI generado desde el código), enlázala en lugar de duplicarla.
- **Numeración de ADR:** siguiente número libre en `docs/adr/` (4 dígitos). Si el proyecto ya usa otro esquema, síguelo.
- **Changelog:** si no existe y el proyecto no lo usa, propón crearlo una vez; si el usuario no lo quiere, no insistas en siguientes ejecuciones (anótalo en el informe).
