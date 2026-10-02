# Formato común de informe

Cada ejecución de una skill SDD termina con un informe en Markdown. Los informes son **locales**: no se publican en Jira ni se versionan (`.sdd/reports/` debe estar en `.gitignore`).

## Ruta

```
<repo>/<rutas.informes>/<ID>/<fase>-<AAAAMMDD-HHmm>.md
```

| Skill | `<ID>` | `<fase>` |
|---|---|---|
| `/inicializa` | `_init` | `inicializa` |
| `/inicializa --global` | `_init` | `inicializa-global` |
| `/planifica` | clave de la épica o, si no hay épica, `_plan-<slug-de-la-idea>` | `planifica` |
| `/desarrolla` | clave de la historia | `desarrolla` |
| `/revisa` | clave de la historia vinculada o, si no hay, `PR-<número>` | `revisa` |
| `/prueba` | clave de la historia | `prueba` |
| `/documenta` | clave de la historia | `documenta` |

La fecha es la hora local (`date +%Y%m%d-%H%M`). Nunca sobrescribas un informe anterior: cada ejecución crea uno nuevo.

## Estructura

```markdown
---
skill: desarrolla
id: PROJ-123
fecha: 2026-10-02T15:30
modo: jira            # jira | local | local-degradado
config: repo          # repo | global (sin config de repo)
resultado: ok         # ok | con_avisos | bloqueado
---

# Informe de <fase> — <ID>

## Resumen
3–5 líneas: qué se pidió, qué se hizo, resultado y lo más importante a saber.

## Resultados
Sección propia de cada skill (historias creadas, tests, hallazgos, casos e2e, documentos…).
Prefiere tablas.

## Hallazgos y recomendaciones
Lista priorizada. Cada punto: qué, por qué importa, qué hacer.

## Avisos
Configuración (claves ignoradas, falta de config de repo), dependencias ausentes, decisiones tomadas por defecto.
Omite la sección si no hay avisos.

## Sin sincronizar
Solo en modo `local-degradado`: qué no se escribió en el tracker y cómo hacerlo después.

## Siguientes pasos
Comandos concretos, p. ej. `/revisa 45`.
```

## Reglas

- `resultado: bloqueado` si la skill se detuvo antes de completar su objetivo; explica el motivo en el resumen.
- `resultado: con_avisos` si se completó, pero con fallos no bloqueantes, degradación o decisiones por defecto.
- Sin secretos ni datos personales innecesarios.
- Las rutas de fichero en el informe son relativas a `<repo>`.
- Al terminar, muestra al usuario la ruta del informe y el resumen. No pegues el informe completo.
