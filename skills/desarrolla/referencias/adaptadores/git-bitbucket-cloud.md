# Adaptador de hosting: Bitbucket Cloud

> Verificado el 2026-10-03 contra un repo real (`jaware-solutions/sdd-sandbox`): las 8 operaciones del contrato.

Bitbucket Cloud no tiene una CLI oficial y el MCP de Atlassian no cubre sus PRs: se usa `curl` contra la API REST 2.0 con **token de API + email de la cuenta** (autenticación *Basic*).

```bash
API=https://api.bitbucket.org/2.0
R="$API/repositories/<workspace>/<repo>"          # de git.repo
BB() { curl -sS -u "$BITBUCKET_EMAIL:$BITBUCKET_API_TOKEN" -H "Accept: application/json" "$@"; }
```

**Seguridad:** nunca imprimas, registres ni copies a ficheros el valor de `BITBUCKET_API_TOKEN`. No uses `curl -v`, no hagas `echo` de la cabecera y no incluyas la orden expandida en el informe.

## Requisitos

```bash
[ -n "$BITBUCKET_EMAIL" ] && [ -n "$BITBUCKET_API_TOKEN" ] || echo "faltan BITBUCKET_EMAIL / BITBUCKET_API_TOKEN"
```

Si faltan: el usuario crea un **API token con scopes** en https://id.atlassian.com/manage-profile/security/api-tokens (app Bitbucket: `read:user`, `read:repository`, `write:repository`, `read:pullrequest`, `write:pullrequest`) y lo exporta en su perfil del shell. No lo pidas en el chat.

**`git push` por HTTPS con ese token:** usuario `x-bitbucket-api-token-auth` y el token como contraseña. Si git no tiene ya la credencial, usa un `GIT_ASKPASS` que lea `BITBUCKET_API_TOKEN` del entorno; no guardes el token en la configuración de git ni en la URL del remoto.

## Operaciones

### `comprobarAcceso()`

```bash
BB "$API/user" | jq -r .display_name
BB -o /dev/null -w '%{http_code}' "$R"      # 200 = acceso; 401 credenciales; 403/404 sin permiso
```

### `crearPR(datos)` `⏸`

```bash
jq -n --arg t "<titulo>" --rawfile d <fichero> --arg o "<origen>" --arg de "<destino>" \
  '{title:$t, description:$d, source:{branch:{name:$o}}, destination:{branch:{name:$de}}, draft:false}' \
| BB -X POST -H "Content-Type: application/json" --data @- "$R/pullrequests" \
| jq '{id, url: .links.html.href}'
```

### `obtenerPR(numero)`

```bash
BB "$R/pullrequests/<id>"
BB -L "$R/pullrequests/<id>/diffstat?pagelen=100" | jq '[.values[] | {ruta: (.new.path // .old.path), "añadidas": .lines_added, eliminadas: .lines_removed}]'
```

Mapeo:

| Campo de Bitbucket | Campo normalizado |
|---|---|
| `id` | `numero` |
| `links.html.href` | `url` |
| `title` / `description` | `titulo` / `descripcion` |
| `source.branch.name` / `destination.branch.name` | `rama_origen` / `rama_destino` |
| `author.display_name` (y `author.account_id` para comparar) | `autor` |
| `state`: `OPEN` | `abierto` (o `borrador` si `draft`) |
| `state`: `MERGED` | `fusionado` |
| `state`: `DECLINED` o `SUPERSEDED` | `cerrado` |
| `source.commit.hash` | `sha_head` (viene abreviado; complétalo con `git rev-parse` tras `git fetch`) |

### `buscarPRPorRama(rama)`

```bash
BB -G "$R/pullrequests" --data-urlencode "q=source.branch.name=\"<rama>\"" \
  --data-urlencode "state=OPEN" --data-urlencode "state=MERGED" --data-urlencode "state=DECLINED" \
| jq '.values[0] | {id, state, url: .links.html.href}'
```

Si no hay PR, `.values` viene vacío (el filtro devuelve campos `null`): trátalo como "no existe".

### `obtenerDiff(numero)`

```bash
BB -L "$R/pullrequests/<id>/diff"     # -L: la API redirige
```

### `listarComentarios(numero)`

```bash
BB "$R/pullrequests/<id>/comments?pagelen=100" \
  | jq '[.values[] | select(.deleted != true) | {id, autor: .user.display_name, ruta: .inline.path, linea: .inline.to, cuerpo: .content.raw}]'
```

Pagina siguiendo `.next` mientras exista.

### `publicarRevision(numero, comentarios, veredicto)` `⏸`

Bitbucket no agrupa: un comentario por llamada.

1. Filtra las líneas contra los hunks del diff; lo que caiga fuera va al resumen. Bitbucket **acepta** comentarios fuera del diff, pero quedan desligados del cambio y confunden al autor.
2. Por cada comentario en línea:
   ```bash
   jq -n --arg c "<cuerpo>" --arg p "<ruta>" --argjson l <linea> '{content:{raw:$c}, inline:{path:$p, to:$l}}' \
   | BB -X POST -H "Content-Type: application/json" --data @- "$R/pullrequests/<id>/comments"
   ```
3. El resumen es un comentario sin `inline`.
4. **Veredicto:**
   - `aprobar` → `BB -X POST "$R/pullrequests/<id>/approve"`.
   - `pedir_cambios` → `BB -X POST "$R/pullrequests/<id>/request-changes"`.
   - `comentar` → nada más.

   **PR propio** (compara `author.account_id` con `BB "$API/user" | jq -r .account_id`): a diferencia de GitHub, Bitbucket **sí permite** aprobar o pedir cambios en el propio PR, pero no es una revisión real y las restricciones de merge que exigen aprobaciones de otros no lo cuentan. Avísalo y, salvo que el revisor insista, publica solo comentarios (`comentar`), igual que en las demás plataformas.

### `estadoCI(numero)`

```bash
BB "$R/pullrequests/<id>/statuses?pagelen=100" | jq '[.values[] | {nombre: .name, estado: .state, url}]'
```

Mapeo de `state`: `SUCCESSFUL` → `ok`; `FAILED` → `fallo`; `INPROGRESS` → `pendiente`; `STOPPED` → `omitido`.

## Notas

- Solo **Bitbucket Cloud** (bitbucket.org). Bitbucket Data Center queda fuera de la v1.
- Límite de tasa: con 429, informa y no reintentes en bucle.
