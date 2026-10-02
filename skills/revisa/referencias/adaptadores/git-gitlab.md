# Adaptador de hosting: GitLab

> ⚠️ **Pendiente de probar contra un repo real** (F7). Escrito a partir de la documentación de `glab` y de la API REST v4. Si una orden falla, informa del error exacto en el informe para corregir el adaptador.

Usa la CLI oficial [`glab`](https://gitlab.com/gitlab-org/cli). En GitLab, un PR es un **merge request (MR)** y su número es el `iid`. Ejecuta las órdenes dentro del repo; `glab api` sustituye `:id` por el ID del proyecto actual. Las respuestas JSON se filtran con `jq`.

## Requisitos

```bash
command -v glab        # si falta: https://gitlab.com/gitlab-org/cli (brew install glab)
glab auth status       # sin sesión: el usuario ejecuta `glab auth login` (también para GitLab autoalojado)
```

## Operaciones

### `comprobarAcceso()`

```bash
glab api user | jq -r .username
glab api projects/:id | jq '.permissions'   # access_level ≥ 30 (Developer) para crear MRs
```

### `crearPR(datos)` `⏸`

```bash
glab mr create --source-branch <origen> --target-branch <destino> \
  --title "<titulo>" --description "$(cat <fichero>)" [--draft] --yes
```

La salida incluye la URL del MR. El `iid` es el último segmento.

### `obtenerPR(numero)`

```bash
glab mr view <iid> --output json
```

Mapeo: `iid` → `numero`, `web_url` → `url`, `description` → `descripcion`, `source_branch` / `target_branch`, `author.username` → `autor`, `state` (`opened` → `abierto` o `borrador` si `draft`, `merged` → `fusionado`, `closed` → `cerrado`), `diff_refs.head_sha` (o `sha`) → `sha_head`.

Ficheros con líneas añadidas y eliminadas:

```bash
glab api "projects/:id/merge_requests/<iid>/diffs?per_page=100" --paginate \
  | jq '[.[] | {ruta: .new_path, diff}]'
```

GitLab no da los recuentos: cuéntalos con las líneas `+` y `-` de cada `diff`.

### `buscarPRPorRama(rama)`

```bash
glab mr list --source-branch <rama> --all --output json | jq '.[0] | {iid, web_url, state}'
```

### `obtenerDiff(numero)`

```bash
glab mr diff <iid> --raw
```

### `listarComentarios(numero)`

```bash
glab api "projects/:id/merge_requests/<iid>/discussions?per_page=100" --paginate \
  | jq '[.[].notes[] | select(.system == false) | {id, autor: .author.username, ruta: .position.new_path, linea: .position.new_line, cuerpo: .body}]'
```

### `publicarRevision(numero, comentarios, veredicto)` `⏸`

GitLab permite agrupar los comentarios como **borradores** y publicarlos de una vez:

1. Obtén `diff_refs` (`base_sha`, `start_sha`, `head_sha`) con `obtenerPR`.
2. Filtra las líneas contra los hunks del diff, igual que en GitHub: lo que caiga fuera va al resumen.
3. Crea un borrador por comentario:
   ```bash
   glab api "projects/:id/merge_requests/<iid>/draft_notes" --method POST \
     -f note="<cuerpo>" \
     -f "position[position_type]=text" -f "position[base_sha]=<base_sha>" \
     -f "position[start_sha]=<start_sha>" -f "position[head_sha]=<head_sha>" \
     -f "position[old_path]=<ruta>" -f "position[new_path]=<ruta>" \
     -f "position[new_line]=<linea>"
   ```
4. El resumen va como borrador sin `position`.
5. Publica todos: `glab api "projects/:id/merge_requests/<iid>/draft_notes/bulk_publish" --method POST`.
6. **Veredicto:**
   - `aprobar` → `glab mr approve <iid>`. La configuración del proyecto puede impedir que el autor apruebe su propio MR; si falla, deja solo el comentario.
   - `pedir_cambios` → el resumen empieza por **"Cambios solicitados"**. Si `glab` lo soporta en la versión instalada, ejecuta también `glab mr revoke <iid>` para retirar una aprobación previa.
   - `comentar` → solo las notas.

### `estadoCI(numero)`

```bash
glab api "projects/:id/merge_requests/<iid>/pipelines" | jq '.[0].id'
glab api "projects/:id/pipelines/<pipeline_id>/jobs?per_page=100" \
  | jq '[.[] | {nombre: .name, estado: .status, url: .web_url}]'
```

Mapeo de `status`: `success` → `ok`; `failed` → `fallo`; `running`, `pending`, `created`, `preparing` o `waiting_for_resource` → `pendiente`; `skipped`, `canceled` o `manual` → `omitido`. Sin pipelines → lista vacía.

## Notas

- GitLab autoalojado: `glab` usa el host del remoto. Si no lo reconoce, `glab auth login --hostname <host>`.
- Rutas con subgrupos: `git.repo` = `grupo/subgrupo/repo`.
