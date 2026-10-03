# Resultados de las evals

## Pasada 1 — 2026-10-03

- **Entorno:** arnés local `evals/_arnes/ejecutar.mjs` (`claude -p --plugin-dir`), una ejecución por caso, Claude Code 2.1.287.
- **Por qué el arnés:** `claude plugin eval` no puede conceder Bash en este Mac (Docker Desktop deja enlaces simbólicos en `~/.docker/cli-plugins` y el sandbox lo rechaza).
- **Graders `llm`:** juzgados a mano sobre la traza y el estado final del workspace.
- **Coste real:** **7,80 $** (0,33 $ de prueba del arnés + 6,43 $ de la pasada + 1,04 $ al repetir un caso corregido), frente a 4–8 $ estimados.

| Caso | Deterministas | Calidad (llm) | Turnos | Coste |
|---|---|---|---|---|
| inicializa-node-github | 8/8 | ✅ | 8 | 0,50 $ |
| inicializa-java-gitflow | 8/8 | — | 7 | 0,46 $ |
| inicializa-idempotente | 2/2 | ✅ no escribe; muestra la tabla de lo detectado | 3 | 0,25 $ |
| planifica-idea-clara | 3/3 | ✅ 1 historia, 5 escenarios (incl. zona horaria y validación), 3 pts, INVEST | 8 | 0,50 $ |
| planifica-idea-grande (repetido) | 2/2 | ✅ épica + 6 historias verticales ≤ 5 pts con dependencias | 7 | 1,04 $ |
| planifica-ambigua | 2/2 | ✅ bloquea, pregunta, no persiste | 5 | 0,35 $ |
| desarrolla-historia-ok | 7/7 | ✅ plan con tareas → E1/E2, tests antes del código, 3 commits convencionales, lint y tests en verde, decisiones explicitadas, sin push | 14 | 0,68 $ |
| desarrolla-dor-falla | 3/3 | ✅ tabla de DoR, sugiere `/planifica HU-002`, no toca nada | 5 | 0,33 $ |
| desarrolla-test-ajeno-roto | 3/3 | ✅ implementa, detecta el test ajeno, no lo toca, se detiene antes del PR | 13 | 0,62 $ |
| revisa-sin-acceso | 1/1 | ✅ se detiene en `comprobarAcceso`, explica cómo resolverlo, no inventa hallazgos | 6 | 0,33 $ |
| prueba-sin-criterios | 2/2 | ✅ no inventa casos | 5 | 0,31 $ |
| prueba-app-caida | 3/3 | ✅ comprueba la URL, no arranca la app, no finge pruebas | 5 | 0,37 $ |
| documenta-funcion-nueva | 3/3 | ✅ README + CHANGELOG, ejemplo verificado contra el código, sin documentos de más | 8 | 0,40 $ |
| documenta-obsoleto | 3/3 | ✅ detecta y corrige; añade una nota de migración; respeta "no crees CHANGELOG" | 6 | 0,36 $ |

**14/14 casos pasan** tras corregir lo de la tabla siguiente.

### Hallazgos y correcciones

| Hallazgo | Tipo | Corrección |
|---|---|---|
| Las skills respondían al usuario en inglés aunque `idioma: es` (visto en la prueba del arnés) | **Skill** | `protocolo-comun.md`: el idioma de la config aplica también a los mensajes y al resumen final. Verificado: la pasada completa ya respondió en español |
| `skill-invocada` daba 0: con `claude -p "/sdd:x"` el comando se expande sin llamar a la herramienta Skill | Arnés | Cuenta como invocación leer ficheros de `skills/<x>` |
| `sin-push` y `sin-commits` saltaban por la mención "git push" en el texto del informe | Grader | Patrón que solo reconoce la orden (inicio, tras `;`, `&`, `\|` o salto de línea); verificado con 4 casos |
| `documenta-obsoleto` penalizaba una nota de migración que cita el nombre antiguo | Grader | Solo falla si el nombre antiguo sigue como fila de la tabla |
| `planifica-idea-grande` pedía "todas cumplen la DoR" sin maquetas: la skill aplicó DoR-6 y se detuvo, que es lo correcto | Caso | El prompt aporta diseño: "no aplica" o el enlace de la maqueta |

### Observaciones para mejorar (no bloquean)

- En `/planifica`, sin PO, las preguntas sin respuesta se cerraron con "no" (por la instrucción de la eval). En uso real conviene que la skill anote esas decisiones por defecto como **supuestos** en las notas de cada historia, para que el PO las vea.
- `/desarrolla` dejó la historia en `en_curso` sin PR (correcto). El "siguiente paso" sugiere relanzar `/desarrolla` para crear el PR tras configurar el remoto: funciona gracias a la reanudación.

## Pasada 2 — modo Jira (2026-10-03)

- **Casos:** `evals/_jira/`, separados de la suite normal porque escriben en Jira real.
- **Proyecto:** `SDD` de pruebas (team-managed) en `jaware-solutions.atlassian.net`.
- **Coste real:** **2,05 $**.

| Caso | Deterministas | Calidad (llm) | Turnos | Coste |
|---|---|---|---|---|
| jira-inicializa | 7/7 | ✅ proyecto, tipos, `en_curso` → In Progress, story points `customfield_10016`; avisa de que no hay estado de revisión; no escribe en Jira | 15 | 0,60 $ |
| jira-planifica | 4/4 | ✅ crea SDD-6 en la épica SDD-1 con 3 pts; descripción con el formato del adaptador (5 escenarios, Esquema con Ejemplos para el límite 5000/5001, fuera de alcance y **supuestos**); comprueba duplicados | 14 | 0,68 $ |
| jira-desarrolla | 7/7 | ✅ lee SDD-5, resuelve la transición por destino y la pasa a In Progress; plan, 2 commits `feat(SDD-5)`, tests en verde, sin push. No avisa de `en_revision` porque no llega al PR (correcto) | 21 | 0,76 $ |

Estado verificado después en Jira: SDD-5 en *In Progress*, SDD-6 creada con puntos.

**Total acumulado de evals: 9,85 $.**
