# Convención de commits

[Conventional Commits 1.0](https://www.conventionalcommits.org/es/v1.0.0/) con la **clave de la historia como scope**. Patrón por defecto (`git.commits.patron`):

```
{tipo}({clave}): {descripcion}
```

```
feat(PROJ-123): añade filtro por rango de fechas en pedidos

El almacén necesita preparar solo los envíos del día. El filtro usa
la zona horaria de la tienda para evitar desfases a medianoche.

Refs: PROJ-123
```

## Tipos

| Tipo | Uso |
|---|---|
| `feat` | Funcionalidad nueva visible para el usuario |
| `fix` | Corrección de un error |
| `refactor` | Cambio interno sin alterar el comportamiento |
| `test` | Añadir o corregir tests, sin cambiar código de producción |
| `docs` | Solo documentación |
| `perf` | Mejora de rendimiento |
| `build` | Sistema de build o dependencias |
| `ci` | Configuración de integración continua |
| `chore` | Mantenimiento que no encaja en lo anterior |

## Reglas

1. **Cabecera ≤ 72 caracteres**. La descripción, en el idioma de la config, en **imperativo o presente** (`añade`, `corrige`), en minúscula y sin punto final.
2. **Cuerpo opcional**, separado por una línea en blanco: explica **por qué**, no qué (el qué está en el diff). Líneas de ≤ 72 caracteres.
3. **Cambios incompatibles**: `!` tras el scope (`feat(PROJ-123)!: …`) y pie `BREAKING CHANGE: <explicación>`.
4. **Commits atómicos**: un commit = un cambio coherente que compila y pasa sus tests. En `/desarrolla`, al menos uno por tarea del plan. Los tests de una tarea van en el mismo commit que su código (o en un `test(...)` justo después).
5. **Nunca** incluyas secretos, ficheros generados ni ficheros de `.sdd/specs/` o `.sdd/reports/`.
6. Si el repo tiene su propia convención en `CONTRIBUTING.md` o en un *commitlint* configurado, **avisa del conflicto** y sigue la de la config SDD salvo que el usuario diga lo contrario.

## Validación

Con el patrón por defecto, la primera línea cumple:

```
^(feat|fix|refactor|test|docs|perf|build|ci|chore)\([A-Z][A-Z0-9]*-[0-9]+\)!?: [^ A-Z].{0,70}[^.]$
```

Para revisar los commits de una rama:

```bash
git log --format=%s <remoto>/<base>..HEAD
```
