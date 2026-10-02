# Adaptador de hosting: Azure DevOps (Azure Repos)

> ⚠️ **Pendiente de probar contra un repo real** (F7). Escrito a partir de la documentación de `az repos` y de la API REST 7.1. Si una orden falla, informa del error exacto en el informe para corregir el adaptador.

Usa la CLI `az` con la extensión `azure-devops` (D9: los comentarios en línea van por `az devops invoke`, sin PAT adicional). Con `git.repo = <org>/<proyecto>/<repo>`, define:

```bash
ORG=https://dev.azure.com/<org>   PROY=<proyecto>   REPO=<repo>
```

Añade `--org "$ORG" --project "$PROY"` a cada orden (o configúralos una vez con `az devops configure --defaults organization="$ORG" project="$PROY"`). Si la ruta del proyecto o del repo tiene espacios, entrecomíllala.

## Requisitos

```bash
command -v az
az extension show --name azure-devops >/dev/null || echo "falta: az extension add --name azure-devops"
az account show >/dev/null || echo "sin sesión: az login"
```

## Operaciones

### `comprobarAcceso()`

```bash
az account show --query user.name -o tsv
az repos show --repository "$REPO" --org "$ORG" --project "$PROY" --query id -o tsv
```

### `crearPR(datos)` `⏸`

```bash
az repos pr create --repository "$REPO" --source-branch <origen> --target-branch <destino> \
  --title "<titulo>" --description "$(cat <fichero>)" [--draft true] \
  --org "$ORG" --project "$PROY" --query pullRequestId -o tsv
```

URL: `$ORG/$PROY/_git/$REPO/pullrequest/<id>`.

### `obtenerPR(numero)`

```bash
az repos pr show --id <id> --org "$ORG" -o json
```

Mapeo:

| Campo de Azure | Campo normalizado |
|---|---|
| `pullRequestId` | `numero` |
| `title` / `description` | `titulo` / `descripcion` |
| `sourceRefName` / `targetRefName` (quita `refs/heads/`) | `rama_origen` / `rama_destino` |
| `createdBy.uniqueName` | `autor` |
| `status`: `active` | `abierto` (o `borrador` si `isDraft`) |
| `status`: `completed` | `fusionado` |
| `status`: `abandoned` | `cerrado` |
| `lastMergeSourceCommit.commitId` | `sha_head` |

Ficheros: con git (`obtenerDiff` y `git diff --numstat`).

### `buscarPRPorRama(rama)`

```bash
az repos pr list --repository "$REPO" --source-branch <rama> --status all --top 1 \
  --org "$ORG" --project "$PROY" --query "[0].{id:pullRequestId,status:status}" -o json
```

### `obtenerDiff(numero)`

Azure no ofrece el diff unificado por CLI. Usa git:

```bash
git fetch <remoto> <origen> <destino>
git diff <remoto>/<destino>...<remoto>/<origen>
```

### `listarComentarios(numero)`

```bash
az devops invoke --area git --resource pullRequestThreads \
  --route-parameters project="$PROY" repositoryId="$REPO" pullRequestId=<id> \
  --org "$ORG" --api-version 7.1 -o json \
  | jq '[.value[] | select(.isDeleted != true) | {ruta: .threadContext.filePath, linea: .threadContext.rightFileStart.line, comentarios: [.comments[] | select(.commentType == "text") | {id, autor: .author.uniqueName, cuerpo: .content}]}]'
```

### `publicarRevision(numero, comentarios, veredicto)` `⏸`

Azure no agrupa: crea **un hilo por comentario** y otro para el resumen.

1. Filtra las líneas contra los hunks del diff; lo que caiga fuera va al resumen.
2. Por cada comentario, escribe un JSON (la ruta empieza por `/`):
   ```json
   {
     "comments": [{ "parentCommentId": 0, "content": "<cuerpo>", "commentType": 1 }],
     "status": 1,
     "threadContext": {
       "filePath": "/src/pedidos.js",
       "rightFileStart": { "line": 6, "offset": 1 },
       "rightFileEnd":   { "line": 6, "offset": 1 }
     }
   }
   ```
   ```bash
   az devops invoke --area git --resource pullRequestThreads \
     --route-parameters project="$PROY" repositoryId="$REPO" pullRequestId=<id> \
     --http-method POST --in-file <fichero.json> --org "$ORG" --api-version 7.1
   ```
3. El resumen es un hilo sin `threadContext`.
4. **Veredicto** (Azure permite votar el propio PR, aunque las políticas pueden no contarlo):
   ```bash
   az repos pr set-vote --id <id> --vote approve|wait-for-author --org "$ORG"
   ```
   `aprobar` → `approve`; `pedir_cambios` → `wait-for-author` (o `reject` si el revisor lo pide expresamente); `comentar` → sin voto.

### `estadoCI(numero)`

```bash
az repos pr policy list --id <id> --org "$ORG" -o json \
  | jq '[.[] | {nombre: (.configuration.settings.displayName // .configuration.type.displayName), estado: .status}]'
```

Mapeo de `status`: `approved` → `ok`; `rejected` o `broken` → `fallo`; `running` o `queued` → `pendiente`; `notApplicable` → `omitido`. Si no hay políticas de build, lista vacía.

## Notas

- Remotos `ssh.dev.azure.com:v3/<org>/<proyecto>/<repo>` y `<org>.visualstudio.com`: mismo `git.repo`, `ORG=https://dev.azure.com/<org>`.
- Si `az devops invoke` resultara demasiado frágil, la alternativa prevista en D9 es la API REST con un PAT en `AZURE_DEVOPS_EXT_PAT`.
