---
name: desarrolla
description: Implementa una historia de usuario SDD - plan técnico aprobado, rama y commits convencionales, tests, checklist de criterios y DoD con evidencia y, si todo está en verde, PR enlazado a la historia.
argument-hint: "[ID de la historia]"
disable-model-invocation: true
---

# /desarrolla

Lleva una historia de "lista para desarrollo" a "PR listo para revisión". **El plan técnico es el contrato:** no se escribe código hasta que el desarrollador lo aprueba, y cada tarea se traza a los criterios de aceptación.

Historia: `$ARGUMENTS`. Si está vacío, pide la clave. Si hay texto adicional, trátalo como indicaciones del desarrollador para el plan.

## 0. Arranque

Sigue `referencias/protocolo-comun.md`. En `local-degradado`, puedes implementar, pero **no** transiciones ni crees nada en el tracker; anótalo en *Sin sincronizar*.

## 1. Precondiciones

1. **Historia:** `obtenerHistoria(<ID>)`. Si no existe, detente.
2. **DoR:** compruébala punto por punto (config o `referencias/convenciones/dor-dod.md`). Si no la cumple, muestra qué falta y detente con *"Siguiente paso: `/planifica <ID>` para refinarla"*. El desarrollador puede forzar continuar; si lo hace, anótalo como aviso en el informe.
3. **Estado del repo:**
   - `git status --porcelain` vacío. Si hay cambios, pregunta si guardarlos con `git stash` o detenerte. Nunca los descartes.
   - Determina la rama base (`referencias/convenciones/ramas.md`) y haz `git fetch <remoto> <base>`.
4. **Reanudar:** si existen `<rutas.specs_locales>/<ID>/plan.md` **y** una rama `*/<ID>-*` (local o remota), ofrece **reanudar** (paso 5, desde la primera tarea sin marcar) o **empezar de cero** (`⏸`: renombra el plan anterior a `plan-<fecha>.md`; no borres la rama).

## 2. Plan técnico

Sigue `referencias/plan-tecnico.md` y escribe `<rutas.specs_locales>/<ID>/plan.md` con `plantillas/plan.md`. En resumen:
- Analiza el código afectado y las convenciones del proyecto (`CLAUDE.md`, `CONTRIBUTING.md`, configuración de lint y tests, código vecino).
- Tareas pequeñas, ordenadas, y **cada una mapeada a uno o más criterios**. Cada criterio debe quedar cubierto por al menos una tarea.
- Ficheros que se crearán o modificarán, tests previstos, riesgos y decisiones.

`⏸` **Aprobación del plan:** muestra un resumen (tareas, mapeo con los criterios, riesgos) y la ruta del fichero. Pide **aprobar**, **cambiar** (y ajusta) o **cancelar**. Sin aprobación no hay código.

## 3. Rama

- Construye el nombre según `referencias/convenciones/ramas.md` (tipo `feature` para historias, `bugfix` para bugs) y valídalo.
- `git switch -c <rama> <remoto>/<base>`. Si la rama ya existe, cámbiate a ella.

## 4. Transición a *en curso* `⏸`

`transicionar(<ID>, en_curso)` según el adaptador. Pide confirmación la primera vez; si la historia ya está en curso, no hagas nada.

## 5. Implementar por tareas

Para cada tarea sin marcar del plan, en orden:

1. **Tests primero cuando sea práctico:** escribe o ajusta el test que expresa el criterio de la tarea y comprueba que falla por la razón esperada.
2. **Implementa** lo mínimo para que pase, siguiendo el estilo del código vecino. Sin refactors ajenos a la tarea.
3. **Ejecuta los tests afectados** (o `comandos.test_unit` si no sabes acotarlos). No avances con la tarea en rojo.
4. **Commit** según `referencias/convenciones/commits.md`. Solo los ficheros de la tarea (`git add <ficheros>`, nunca `git add -A` a ciegas) y nunca nada de `.sdd/`.
5. **Marca la tarea** en `plan.md`: `- [x] T3 … (commit <sha corto>)`.

**Desviaciones:** si una tarea no se puede hacer como estaba planeada (el código es distinto de lo previsto, falta algo, aparece un caso no cubierto):
- **Pequeña** (detalle técnico) → ajusta, anótalo en la sección *Desviaciones* del plan y sigue.
- **Afecta al alcance o a los criterios** → para y pregunta. Si cambia un criterio, eso es una decisión de negocio: sugiere actualizar la historia.

## 6. Verificación final

Ejecuta, en este orden, los comandos de la config que no estén vacíos: `comandos.lint`, `comandos.test_unit` y `comandos.test_integracion`.

- Si algo falla y está relacionado con la historia, corrige y haz commit (`fix(<ID>): …`). Como máximo `desarrollo.max_intentos_correccion` (3) ciclos.
- Si falla algo **ajeno** a la historia (test roto de antes, flaky): compruébalo en la base con `git stash` o `git worktree` si es barato; si no, anótalo como sospecha. Pregunta si continuar.
- Si tras los intentos sigue en rojo: `resultado: bloqueado`. **No se crea PR.** Ve al paso 9 (informe) con la salida relevante de los errores.

## 7. Checklist de cierre

Sigue `referencias/checklist-cierre.md`:
- **Criterios:** una fila por escenario, con su evidencia (test que lo cubre, fichero y línea) y su estado (✅ / ❌).
- **DoD:** cada punto ✅, ❌ o ⏳ pendiente (con el comando que lo completa).
- **Convenciones:** rama y commits validados con las regex.

Si algún criterio queda ❌, **no** ofrezcas PR: explica qué falta y vuelve al paso 5 si el desarrollador quiere.

## 8. PR `⏸`

Con todo en verde:
1. Muestra el checklist y pregunta si hacer **push** y crear el **PR**.
2. `git push -u <remoto> <rama>`.
3. `crearPR` (adaptador del hosting; antes, `buscarPRPorRama` para no duplicarlo):
   - Título `<tipo>(<ID>): <título de la historia>`.
   - Destino: la base del preset.
   - Descripción: `plantillas/pr.md` con el enlace a la historia, el resumen de los cambios y **el checklist completo**. Los informes son locales: el revisor solo verá lo que esté en el PR.
4. `transicionar(<ID>, en_revision)` si está mapeado. `vincular` según el adaptador (en Jira no hace nada, D10).
5. Devuelve la **URL del PR**.

Si el desarrollador no quiere PR todavía, termina igual con el informe y sugiere cómo crearlo después.

## 9. Informe

Según `referencias/informe.md` (ID de la historia, fase `desarrolla`). En *Resultados*:
- Tabla de tareas con sus commits.
- Salida resumida de lint y tests: números, no logs completos.
- Cobertura, si el comando la da.
- Checklist de cierre.
- URL del PR.

En *Hallazgos*: desviaciones del plan, deuda técnica detectada y riesgos para la revisión.

**Siguientes pasos:**
- `/revisa <n.º PR>`
- `/prueba <ID>` si hay criterios con flujo de usuario.
- `/documenta <ID>`.

## Referencias bajo demanda

| Cargar | Cuando |
|---|---|
| `referencias/protocolo-comun.md` | Siempre, al empezar |
| `referencias/convenciones/dor-dod.md` | Precondiciones y checklist |
| `referencias/plan-tecnico.md`, `plantillas/plan.md` | Paso 2 |
| `referencias/convenciones/ramas.md` | Pasos 1 y 3 |
| `referencias/convenciones/commits.md` | Paso 5 |
| `referencias/checklist-cierre.md` | Paso 7 |
| `referencias/adaptadores/git-<hosting>.md`, `plantillas/pr.md` | Paso 8 |
| `referencias/adaptadores/tracker-<modo>.md` | Pasos 1, 4 y 8 |
| `referencias/informe.md` | Paso 9 |
