# Contrato del tracker

Operaciones que las skills piden al tracker, independientes de su implementación (`tracker-local.md`, `tracker-jira.md`). Cada adaptador explica cómo realizarlas.

## Modelo normalizado: `Historia`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | texto | Clave: `PROJ-123` o `HU-007` |
| `tipo` | `epica` \| `historia` \| `bug` | |
| `titulo` | texto | Resumen corto |
| `como` / `quiero` / `para` | texto | Enunciado de la historia (vacío en épicas y bugs) |
| `criterios` | lista de escenarios Gherkin | Cada uno con `nombre` y `pasos` (texto Gherkin) |
| `notas` | texto | Contexto, reglas de negocio, fuera de alcance |
| `estado` | `por_hacer` \| `en_curso` \| `en_revision` \| `hecho` | Estado **lógico** (el adaptador traduce) |
| `puntos` | número \| vacío | Fibonacci |
| `epica` | clave \| vacío | Épica padre |
| `dependencias` | lista de claves | Historias que deben ir antes |
| `enlaces` | lista de `{tipo, url}` | `pr`, `diseno`, `doc`, `bug`… |
| `url` | texto \| vacío | Enlace navegable a la historia (Jira) o ruta del fichero (local) |

Un `bug` añade: `pasos_reproducir`, `esperado`, `obtenido`, `evidencias` (rutas) e `historia` (clave relacionada).

## Operaciones

| Operación | Entrada | Salida | Notas |
|---|---|---|---|
| `obtenerHistoria(id)` | clave | `Historia` | Si no existe, error *"historia no encontrada"*; no inventes |
| `buscarHistorias(filtro)` | `{epica?, estado?, texto?}` | lista de `Historia` (sin criterios) | Para detectar duplicados y listar épicas |
| `crearEpica(datos)` | `Historia` sin `id` | `Historia` con `id` y `url` | `⏸` |
| `crearHistoria(datos)` | `Historia` sin `id` | `Historia` con `id` y `url` | `⏸`; antes, `buscarHistorias` por título para evitar duplicados |
| `actualizarHistoria(id, cambios)` | clave + campos | `Historia` | `⏸`; solo los campos indicados |
| `transicionar(id, estado)` | clave + estado lógico | estado resultante | `⏸`; si ya está en ese estado, no hace nada |
| `vincular(id, enlace)` | clave + `{tipo, url}` | — | En Jira no se hace nada (D10): el vínculo lo crea la integración del hosting |
| `crearBug(datos)` | bug sin `id` | bug con `id` y `url` | `⏸`; enlazado a `historia` |

No hay operación de **comentar**: los informes no se publican en el tracker (RF-T5).

## Errores

- **Tracker inaccesible a mitad de la ejecución:** detén las escrituras pendientes, informa de qué se escribió y qué no (sección *Sin sincronizar* del informe) y no reintentes en bucle.
- **Estado lógico sin mapeo** (Jira): no transiciones. Avisa y sugiere ejecutar `/inicializa` para completar el mapeo.
