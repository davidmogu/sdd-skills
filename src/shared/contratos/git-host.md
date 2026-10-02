# Contrato del hosting Git

Operaciones sobre PRs comunes a las cuatro plataformas. Cada adaptador (`git-<hosting>.md`) explica cómo realizarlas. Las operaciones de git local (ramas, commits, push) se hacen con `git` directamente y no forman parte del contrato.

## Detección del hosting (a partir de la URL del remoto)

```bash
git remote get-url <git.remoto>
```

| Patrón de la URL | `git.hosting` | `git.repo` |
|---|---|---|
| `github.com[:/]<org>/<repo>(.git)?` | `github` | `<org>/<repo>` |
| `gitlab.com[:/]<grupo>/…/<repo>(.git)?` o un host con `gitlab` | `gitlab` | `<grupo>/…/<repo>` (con subgrupos) |
| `dev.azure.com/<org>/<proyecto>/_git/<repo>` · `ssh.dev.azure.com:v3/<org>/<proyecto>/<repo>` · `<org>.visualstudio.com/<proyecto>/_git/<repo>` | `azure` | `<org>/<proyecto>/<repo>` |
| `bitbucket.org[:/]<workspace>/<repo>(.git)?` | `bitbucket-cloud` | `<workspace>/<repo>` |

GitHub Enterprise o GitLab autoalojado: si el host no es reconocible, pregunta al usuario.

## Modelo normalizado: `PR`

| Campo | Descripción |
|---|---|
| `numero` | ID del PR o MR |
| `url` | Enlace navegable |
| `titulo`, `descripcion` | |
| `rama_origen`, `rama_destino` | |
| `autor` | Usuario |
| `estado` | `abierto` \| `fusionado` \| `cerrado` \| `borrador` |
| `sha_head` | Último commit de la rama origen |
| `ficheros` | Lista de `{ruta, añadidas, eliminadas}` |

## Operaciones

| Operación | Entrada | Salida | Notas |
|---|---|---|---|
| `comprobarAcceso()` | — | usuario autenticado o error | Antes de cualquier otra operación |
| `crearPR(datos)` | `{titulo, descripcion, origen, destino, borrador?}` | `PR` | `⏸`; si ya existe un PR abierto desde `origen`, devuélvelo en lugar de crear otro |
| `obtenerPR(numero)` | número | `PR` | |
| `buscarPRPorRama(rama)` | rama origen | `PR` \| vacío | Para idempotencia y para `/documenta` |
| `obtenerDiff(numero)` | número | diff unificado | En diffs grandes, por fichero |
| `listarComentarios(numero)` | número | lista de `{id, autor, ruta?, linea?, cuerpo}` | Generales y en línea |
| `publicarRevision(numero, comentarios, veredicto)` | lista de `{ruta, linea, cuerpo}` + `comentar` \| `aprobar` \| `pedir_cambios` + resumen | URL de la revisión | `⏸`; en un solo envío si la plataforma lo permite |
| `estadoCI(numero)` | número | lista de `{nombre, estado: ok\|fallo\|pendiente\|omitido, url}` | |

**Líneas en los comentarios:** `linea` es el número de línea en la **versión nueva** del fichero (lado derecho del diff). Solo se pueden comentar líneas que aparecen en el diff; si un hallazgo apunta fuera, ponlo en el resumen general de la revisión.

**Veredicto sobre un PR propio:** las plataformas no permiten aprobar ni pedir cambios en un PR propio. En ese caso, publica con veredicto `comentar` e indícalo.

## Errores comunes

| Síntoma | Acción |
|---|---|
| CLI no instalada | Indica cómo instalarla (ver adaptador) y continúa sin operaciones de hosting |
| No autenticado | Indica el comando de login. **No** pidas el token en el chat |
| Sin permisos en el repo | Informa; no reintentes |
| Rama no publicada en el remoto | `git push -u <remoto> <rama>` (`⏸`) antes de `crearPR` |
