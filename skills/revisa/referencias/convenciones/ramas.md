# Convención de ramas

El nombre lo construye `git.ramas.patron` (por defecto `{tipo}/{clave}-{slug}`) y la rama base depende del preset (`git.ramas.preset`). Si `git.ramas.base` está definida en la config, manda sobre el preset.

## Presets

| Preset | Ramas permanentes | Base de `feature` / `bugfix` / `chore` | Base de `hotfix` | Destino del PR | Notas |
|---|---|---|---|---|---|
| `gitflow` | `main`, `develop` | `develop` | `main` | `develop` (hotfix: `main` y luego `develop`) | `release/x.y.z` sale de `develop`; las skills no crean releases |
| `github-flow` | `main` | `main` | `main` | `main` | Ramas cortas; `main` siempre desplegable |
| `trunk` | `main` | `main` | `main` | `main` | Ramas de horas o pocos días; si la historia es grande, divídela antes |

Antes de crear una rama:

```bash
git fetch <remoto> <base>
git switch -c <rama> <remoto>/<base>
```

## Construcción del nombre

| Variable | Valor |
|---|---|
| `{tipo}` | `feature` (historia), `bugfix` (bug), `hotfix` (bug urgente en producción), `chore` (tarea técnica). Debe estar en `git.ramas.tipos` |
| `{clave}` | Clave de la historia tal cual: `PROJ-123` (Jira) o `HU-007` (local) |
| `{slug}` | Derivado del título de la historia (reglas abajo) |

**Reglas del slug:**
1. Minúsculas, sin tildes ni eñes (`ñ` → `n`, `á` → `a`).
2. Solo `[a-z0-9]`; cualquier otro carácter pasa a `-`; sin guiones repetidos ni al principio o final.
3. Quita las palabras vacías (`de`, `la`, `el`, `los`, `las`, `un`, `una`, `y`, `o`, `para`, `por`, `con`, `en`, `a`, `del`, `al`) salvo que el slug quede vacío.
4. Máximo 40 caracteres, cortando por guion completo.

Ejemplo: *"Filtrar pedidos por fecha de envío"* + `HU-007` → `feature/HU-007-filtrar-pedidos-fecha-envio`

## Validación

Con el patrón por defecto, una rama válida cumple:

```
^(feature|bugfix|hotfix|chore)/[A-Z][A-Z0-9]*-[0-9]+-[a-z0-9]+(-[a-z0-9]+)*$
```

Ajusta la alternativa de tipos a `git.ramas.tipos`. Si el patrón de la config es otro, constrúyelo a partir del patrón.

- **Antes de crear** una rama, valida el nombre generado.
- **Si ya estás en una rama** para la historia (p. ej. al reanudar), valida su nombre. Si no cumple, avísalo, pero no la renombres sin confirmación (`⏸`).
- **Si la rama ya existe** en local o en el remoto: no la recrees. Ofrece cambiar a ella y reanudar.
- Nunca trabajes directamente en `main`, `develop` ni `release/*`.
