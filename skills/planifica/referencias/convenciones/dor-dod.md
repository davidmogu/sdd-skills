# Definition of Ready y Definition of Done (estándar)

Valores por defecto cuando ningún nivel de config define `dor` / `dod`. `/inicializa` los copia a la config del repo para que el equipo los ajuste.

## Definition of Ready (DoR)

La comprueban `/planifica` (al validar) y `/desarrolla` (antes de empezar).

| ID | Criterio | Cómo se verifica |
|---|---|---|
| DoR-1 | Formato *Como / Quiero / Para* con un valor de negocio claro | Los tres elementos presentes; el *Para* expresa un beneficio, no repite el *Quiero* |
| DoR-2 | Al menos un criterio de aceptación en Gherkin, todos verificables | Cada escenario tiene *Dado / Cuando / Entonces*; el *Entonces* es observable (sin "funciona bien", "rápido", "intuitivo" sin cuantificar) |
| DoR-3 | Cumple INVEST y está estimada en ≤ `planificacion.max_puntos` (8) | Rúbrica INVEST sin *falla*; puntos en Fibonacci |
| DoR-4 | Dependencias identificadas y no bloqueantes | Lista de dependencias (puede estar vacía); ninguna en estado *por hacer* que impida empezar |
| DoR-5 | Sin preguntas abiertas para negocio | No hay apartado de dudas pendientes |
| DoR-6 | Diseño o maqueta enlazada si afecta a la UI | Enlace presente o "no aplica" justificado |

**Resultado:** *cumple* si todos pasan. Si alguno falla, indica cuál y qué falta. Que la historia la escriba el PO no exime de la DoR.

## Definition of Done (DoD)

La comprueba el checklist de cierre de `/desarrolla`. Algunos puntos se completan después, con otras skills.

| ID | Criterio | Evidencia | Lo comprueba |
|---|---|---|---|
| DoD-1 | Todos los criterios de aceptación cumplidos y con evidencia | Tabla criterio → test, fichero o captura | `/desarrolla` |
| DoD-2 | Lint y tests unitarios y de integración en verde | Salida de los comandos de la config | `/desarrolla` |
| DoD-3 | Tests nuevos para el comportamiento añadido o corregido | Ficheros de test en el diff | `/desarrolla`, `/revisa` |
| DoD-4 | Ramas y commits siguen las convenciones | Validación de `ramas.md` y `commits.md` | `/desarrolla`, `/revisa` |
| DoD-5 | PR creado con descripción y enlace a la historia; revisión aprobada | URL del PR; veredicto de la revisión | `/desarrolla` (crea), `/revisa` (aprueba) |
| DoD-6 | Criterios con flujo de usuario validados e2e | Informe de `/prueba` | `/prueba` |
| DoD-7 | Documentación actualizada | Informe de `/documenta` | `/documenta` |

Al cerrar `/desarrolla`, DoD-5 (aprobación), DoD-6 y DoD-7 quedan **pendientes**, no fallidos. El checklist los muestra con el comando que los completa.
