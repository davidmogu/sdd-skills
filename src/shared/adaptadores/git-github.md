# Adaptador de hosting: GitHub

Usa la CLI oficial [`gh`](https://cli.github.com) (probado con 2.96). Todas las órdenes se ejecutan dentro del repo; `gh` deduce `<org>/<repo>` del remoto. Si hay varios remotos, añade `--repo <git.repo>`.

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

Una sola revisión con todos los comentarios en línea. Construye el JSON en un fichero temporal:

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
- `line` es la línea en la versión nueva. Si GitHub responde 422 (*"line must be part of the diff"*), saca ese comentario de `comments` y añádelo al `body` con su `ruta:línea`.
- Comentarios en varias líneas: añade `"start_line": <n>, "start_side": "RIGHT"`.

### `estadoCI(numero)`

```bash
gh pr checks <numero> --json name,state,bucket,link
```

Mapeo de `bucket`: `pass` → `ok`, `fail` → `fallo`, `pending` → `pendiente`, `skipping` o `cancel` → `omitido`. Si no hay checks configurados, `gh` termina con error y el mensaje *"no checks reported"*: trátalo como lista vacía.

## Notas

- Un PR fusionado se puede seguir consultando (`obtenerPR`, `obtenerDiff`), algo útil para `/documenta`.
- Límite de tasa: si `gh` devuelve 403 con *rate limit*, informa y no reintentes en bucle.
