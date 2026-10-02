# Adaptador de hosting: Bitbucket Cloud

> ⚠️ **Pendiente de probar contra un repo real** (F7). Escrito a partir de la documentación de la API REST 2.0. Si una llamada falla, informa del código y del mensaje en el informe para corregir el adaptador.

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

Si faltan: el usuario crea un **API token** en Bitbucket (scopes `read:repository`, `read:pullrequest`, `write:pullrequest`) y lo exporta en su perfil del shell. No lo pidas en el chat.

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
BB "$R/pullrequests/<id>/diffstat?pagelen=100" | jq '[.values[] | {ruta: (.new.path // .old.path), "añadidas": .lines_added, eliminadas: .lines_removed}]'
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

1. Filtra las líneas contra los hunks del diff; lo que caiga fuera va al resumen.
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

   Bitbucket no permite aprobar el propio PR: compara `author.account_id` con `BB "$API/user" | jq -r .account_id`.

### `estadoCI(numero)`

```bash
BB "$R/pullrequests/<id>/statuses?pagelen=100" | jq '[.values[] | {nombre: .name, estado: .state, url}]'
```

Mapeo de `state`: `SUCCESSFUL` → `ok`; `FAILED` → `fallo`; `INPROGRESS` → `pendiente`; `STOPPED` → `omitido`.

## Notas

- Solo **Bitbucket Cloud** (bitbucket.org). Bitbucket Data Center queda fuera de la v1.
- Límite de tasa: con 429, informa y no reintentes en bucle.
