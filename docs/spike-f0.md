# Spike F0: verificación de supuestos de Claude Code

> 2026-10-02 · Claude Code 2.1.287 · Node 24.18 · Skill de prueba: `src/skills/hola`

| # | Supuesto | Resultado | Evidencia |
|---|---|---|---|
| 1 | `/sdd:hola` funciona con namespace y recibe argumentos (`$ARGUMENTS`) | ✅ | `claude -p "/sdd:hola Mundo" --plugin-dir .` → `ARGS=Mundo` |
| 2 | `disable-model-invocation: true` impide la activación automática | ✅ (más estricto de lo esperado) | Al pedirle al modelo que use la skill, responde que **no la ve**: queda fuera de su lista de skills |
| 3 | Lectura de referencias relativas a la carpeta de la skill, incluidas las copiadas desde `src/shared/` | ✅ | `LOCAL=SALUDO-7f3a`, `COMPARTIDO=SHARED-91bc` |
| 4 | La misma carpeta copiada a `.claude/skills/hola/` se invoca como `/hola` | ✅ | Proyecto temporal sin plugin → salida idéntica; las rutas se resuelven contra la nueva ubicación |
| 5 | `claude plugin eval` está disponible y conocemos su formato | ✅ | `evals/hola/{prompt.md, graders/criteria.md}` → score 1.00, $0.05 por ejecución |

## Hallazgos que cambian el diseño

1. **Con el plugin también funciona el nombre corto.** `/hola` resuelve a `sdd:hola` cuando no hay otra skill con el mismo nombre. **D8 se actualiza:** se documenta `/inicializa` como forma principal en los dos canales, y `/sdd:inicializa` queda como forma explícita para resolver conflictos.
2. **Una skill con `disable-model-invocation` es invisible para el modelo.** Una skill no puede invocar a otra (p. ej. `/desarrolla` no puede lanzar `/revisa`); como mucho la sugiere en el texto del informe ("Siguiente paso: `/revisa 45`"). Esto ya era lo previsto en el diseño. Por la misma razón, los subagentes tampoco pueden invocarlas: deben recibir sus instrucciones por prompt o leer los ficheros de `referencias/`.
3. **Formato de evals:** `evals/<caso>/prompt.md` (frontmatter `max_turns` y `allowed_tools`; cuerpo = prompt, que acepta el comando de barra) + `graders/*.md` (`type: llm`, `weight`). Opciones útiles: `--runs`, `--ablation none`, `--threshold`, `--trust-plugin` (CI), `--scaffold` (repos de ejemplo) y `--mocks record` (MCP simulados, aplicable a Jira y Confluence en F6 y F9).
4. **`claude plugin validate`** valida los manifiestos y **`claude plugin tag`** crea tags `{name}--v{version}` comprobando que `plugin.json` y `marketplace.json` coinciden. Lo usaremos en F11 en lugar de un `release.mjs` propio para crear el tag.

## Pendiente

- Eliminar la skill `hola`, su referencia compartida `src/shared/spike/` y `evals/hola/` antes de `v0.1.0`. De momento se mantienen como *smoke test* del build y de las evals.
