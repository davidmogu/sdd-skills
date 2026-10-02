# Adaptador de hosting: GitHub

Usa la CLI oficial [`gh`](https://cli.github.com) (probado con 2.96 contra un repo real el 2026-10-02: todas las operaciones). Todas las órdenes se ejecutan dentro del repo; `gh` deduce `<org>/<repo>` del remoto. Si hay varios remotos, añade `--repo <git.repo>`.

## Requisitos

```bash
command -v gh          # si falta: https://cli.github.com (brew install gh · winget install GitHub.cli)
gh auth status         # si no hay sesión: el usuario ejecuta `gh auth login` (no pidas tokens en el chat)
```

## Operaciones

### `comprobarAcceso()`

```bash
gh api user --jq .login
gh repo view --json viewerPermission --jq .viewerPermission   # WRITE, MAINTAIN o ADMIN para crear PRs
```

### `crearPR(datos)` `⏸`

Comprueba primero que no exista ya (`buscarPRPorRama`). Escribe la descripción en un fichero temporal para conservar el formato:

```bash
gh pr create --base <destino> --head <origen> --title "<titulo>" --body-file <fichero> [--draft]
```

La salida es la URL del PR. El número es el último segmento.

### `obtenerPR(numero)`

```bash
gh pr view <numero> --json number,url,title,body,headRefName,baseRefName,author,state,isDraft,headRefOid,files
```

Mapeo: `state` OPEN → `abierto` (o `borrador` si `isDraft`), MERGED → `fusionado`, CLOSED → `cerrado`. `headRefOid` → `sha_head`. `files[].{path,additions,deletions}` → `ficheros`.

### `buscarPRPorRama(rama)`

```bash
gh pr list --head <rama> --state all --json number,url,state --limit 1
```

### `obtenerDiff(numero)`

```bash
gh pr diff <numero>                       # completo
gh pr diff <numero> --name-only           # solo los ficheros, para repartir diffs grandes
```

### `listarComentarios(numero)`

```bash
# En línea (de revisiones)
gh api repos/{owner}/{repo}/pulls/<numero>/comments --paginate \
  --jq '.[] | {id, autor: .user.login, ruta: .path, linea: .line, cuerpo: .body}'
# Generales
gh api repos/{owner}/{repo}/issues/<numero>/comments --paginate \
  --jq '.[] | {id, autor: .user.login, cuerpo: .body}'
```

`gh api` sustituye `{owner}` y `{repo}` por los del repo actual.

### `publicarRevision(numero, comentarios, veredicto)` `⏸`

Una sola revisión con todos los comentarios en línea.

**Antes de enviar:**
1. **Filtra las líneas contra el diff.** De cada cabecera `@@ -a,b +c,d @@` de `gh pr diff`, las líneas comentables de ese fichero son `c … c+d-1`. Los comentarios con `line` fuera de esos rangos se sacan de `comments` y se añaden al `body` como `` `ruta:línea` **[severidad]** texto ``. GitHub rechaza **la revisión entera** (422 *"Line could not be resolved"*) si un solo comentario apunta fuera del diff, y no dice cuál.
2. **PR propio:** si `autor` del PR = `gh api user --jq .login`, usa siempre `event: COMMENT` (APPROVE o REQUEST_CHANGES devuelven 422 *"Can not approve your own pull request"*) e indícalo en el resumen.

Construye el JSON en un fichero temporal:

```json
{
  "commit_id": "<sha_head>",
  "event": "COMMENT",
  "body": "<resumen de la revisión>",
  "comments": [
    { "path": "src/pedidos/filtro.ts", "line": 42, "side": "RIGHT", "body": "**[importante]** …" }
  ]
}
```

```bash
gh api repos/{owner}/{repo}/pulls/<numero>/reviews --method POST --input <fichero.json> --jq .html_url
```

- `event`: `COMMENT` (comentar), `APPROVE` (aprobar) o `REQUEST_CHANGES` (pedir cambios). En un PR propio solo vale `COMMENT`.
- `line` es la línea en la versión nueva.
- Si aun así responde 422 *"Line could not be resolved"*, vuelve a calcular los rangos con el diff actual (puede haber commits nuevos y otro `sha_head`) y reintenta **una vez**.
- Comentarios en varias líneas: añade `"start_line": <n>, "start_side": "RIGHT"`.

### `estadoCI(numero)`

```bash
gh pr checks <numero> --json name,state,bucket,link
```

Mapeo de `bucket`: `pass` → `ok`, `fail` → `fallo`, `pending` → `pendiente`, `skipping` o `cancel` → `omitido`.

- **Duplicados:** si el workflow se ejecuta en `push` y `pull_request`, cada check aparece dos veces con el mismo `name`. Agrupa por `name` y quédate con el peor estado (`fallo` > `pendiente` > `ok` > `omitido`).
- Si no hay checks configurados, `gh` termina con código distinto de 0 y sin JSON: trátalo como lista vacía.

## Notas

- Un PR fusionado se puede seguir consultando (`obtenerPR`, `obtenerDiff`), algo útil para `/documenta`.
- Límite de tasa: si `gh` devuelve 403 con *rate limit*, informa y no reintentes en bucle.
