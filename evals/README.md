# Evals

14 casos de `claude plugin eval`, al menos uno por skill. Las skills que escriben (`/planifica` y `/desarrolla`) tienen además casos **negativos**, que comprueban que la skill se detiene cuando debe.

| Skill | Casos |
|---|---|
| `/inicializa` | `inicializa-node-github`, `inicializa-java-gitflow`, `inicializa-idempotente` (negativo) |
| `/planifica` | `planifica-idea-clara`, `planifica-idea-grande`, `planifica-ambigua` (negativo) |
| `/desarrolla` | `desarrolla-historia-ok`, `desarrolla-dor-falla` (negativo), `desarrolla-test-ajeno-roto` (negativo) |
| `/revisa` | `revisa-sin-acceso` (negativo) |
| `/prueba` | `prueba-sin-criterios` (negativo), `prueba-app-caida` (negativo) |
| `/documenta` | `documenta-funcion-nueva`, `documenta-obsoleto` |

## Cómo están hechos

- **Sin humano:** cada `prompt.md` incluye las respuestas a las confirmaciones (`⏸`). `append_system_prompt` indica que lo no cubierto se responde con "no". `AskUserQuestion` no está permitida.
- **Repos de ejemplo:** cada caso tiene un `setup.sh` que crea un repo Node mínimo en el workspace vacío (piezas comunes en `_comun/`). `npm test` ejecuta todos los scaffolds y valida los `case.yaml` **sin coste**.
- **Graders:** deterministas siempre que se puede (`file_exists`, `regex` sobre ficheros o la traza, `tool_used` con `min: 0, max: 0` para "no hizo X") y `llm` para la calidad.

## Fuera de las evals automáticas

- **`/revisa` sobre un PR real:** el scaffold usa un `HOME` temporal y no hay autenticación de `gh`. Se prueba a mano: `claude --plugin-dir .` en `davidmogu/sdd-sandbox` → `/revisa 1`.
- **Jira y Confluence:** requieren un proyecto y un espacio de pruebas, o mocks del MCP en `evals/mocks/atlassian/`.
- **GitLab, Azure DevOps y Bitbucket:** requieren sandboxes (D11).
- **`/prueba` con navegador:** requiere una aplicación levantada y un MCP de navegador.

## Ejecutar (cuesta dinero o cuota)

> Resultados de la última pasada: [`RESULTADOS.md`](RESULTADOS.md). Coste real de una pasada completa: ~6,5 $.

### Arnés local (si el sandbox no puede dar Bash)

En macOS con Docker Desktop, `claude plugin eval` rechaza los casos con Bash por los enlaces de `~/.docker/cli-plugins`. El arnés ejecuta los mismos `case.yaml` con `claude -p --plugin-dir`, sin sandbox:

```bash
node evals/_arnes/ejecutar.mjs -j 4 --max-cost-usd 8                 # todos
node evals/_arnes/ejecutar.mjs --tag negativo --max-cost-usd 2       # un subconjunto
node evals/_arnes/ejecutar.mjs --regrade evals/results/local-<fecha>  # recalcular graders sin coste
```

Evalúa `file_exists`, `regex` y `tool_used`; los `llm` quedan como *pendiente de juicio* (revisa `trace.jsonl` y el workspace indicado en `resultado.json`).

### `claude plugin eval`

```bash
# Una pasada de todo, sin comparar contra "sin plugin", con tope de gasto
claude plugin eval . --scaffold --allow-tools Bash Write Edit \
  --runs 1 --ablation none --no-publish --max-cost-usd 8

# Solo los negativos (baratos), o una skill
claude plugin eval . --scaffold --allow-tools Bash Write Edit --tag negativo --runs 1 --ablation none --no-publish
claude plugin eval . --scaffold --allow-tools Bash Write Edit --case 'desarrolla-*' --runs 3 --ablation none --no-publish
```

`--scaffold` ejecuta los `setup.sh` de este directorio (código propio, revisado). `--allow-tools` concede Bash, Write y Edit a la sesión evaluada, que trabaja dentro del workspace temporal.

### Coste orientativo

Es una estimación, no una medición: depende del modelo y de cuántos turnos use cada caso. La única referencia medida es el spike F0: 0,05 $ por un caso trivial.

| Ejecución | Sesiones | Coste estimado |
|---|---|---|
| Solo negativos, `--runs 1` | 8 | 1–2 $ |
| Todo, `--runs 1` | 14 | 4–8 $ |
| Todo, `runs` por defecto (2–3 por caso) | 33 | 10–20 $ |

`--model sonnet` lo abarata. Usa siempre `--max-cost-usd` como tope.
