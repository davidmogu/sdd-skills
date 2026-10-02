---
name: planifica
description: Convierte una idea o requerimiento en épica e historias de usuario con criterios Gherkin y story points, validadas contra INVEST y la DoR en rondas de refinamiento con el PO; las guarda en Jira o en specs/.
argument-hint: "[idea o requerimiento]"
disable-model-invocation: true
---

# /planifica

Guía al PO desde una idea hasta historias **listas para desarrollo**: claras, verificables, estimadas y que cumplen la DoR.

Idea recibida: `$ARGUMENTS`

Si la idea está vacía, pídela antes de seguir. Si es la clave de una historia o épica existente (`PROJ-12`, `HU-003`), el objetivo es **refinarla**: cárgala con `obtenerHistoria` y entra en el bucle desde *Validar*.

## 0. Arranque

Sigue `referencias/protocolo-comun.md`. En modo `local-degradado` puedes refinar en la conversación, pero **no persistas** historias nuevas (protocolo §3).

## 1. Bucle de refinamiento

Máximo `planificacion.max_rondas` rondas (por defecto 3). Una ronda = **Entender → Proponer → Validar → Revisar con el PO**. Indica siempre en qué ronda estás (`Ronda 2/3`).

### 1.1 Entender

Antes de proponer nada, identifica los huecos de la idea y pregunta **solo lo que bloquea** (máx. 5 preguntas por ronda, con opciones cuando sea posible):
- Quién es el usuario y qué problema resuelve.
- Qué incluye y, sobre todo, **qué queda fuera**.
- Reglas de negocio, límites, casos de error.
- Restricciones (fechas, sistemas existentes, permisos, datos).
- Si afecta a la UI: ¿hay diseño o maqueta?

Si el repo tiene código relacionado, léelo por encima para hacer preguntas informadas (no para diseñar la solución). Revisa también las historias existentes (`buscarHistorias`) para detectar solapes.

### 1.2 Proponer

Redacta con `plantillas/historia.md` (y `plantillas/epica.md` si hay más de una historia):
- **Épica** si la idea necesita 2 o más historias.
- **Historias** verticales (cada una aporta valor de usuario por sí misma), con criterios en Gherkin según `referencias/gherkin.md`.
- **Story points** según `referencias/estimacion.md`.
- **Dependencias** explícitas entre ellas.

Toma como guía `referencias/ejemplos.md`.

### 1.3 Validar

Para cada historia aplica:
1. La rúbrica `referencias/invest.md`: I, N, V, E, S, T → `pasa`, `aviso` o `falla`, con motivo.
2. La DoR de la config (o `referencias/convenciones/dor-dod.md`), punto por punto.

Reglas duras:
- Más de `planificacion.max_puntos` (8) → **falla S**: propón una división (`referencias/estimacion.md` §División).
- Criterio no verificable ("rápido", "intuitivo", "funciona bien" sin cuantificar) → **falla T**.
- Preguntas abiertas para negocio → DoR-5 no cumplida.

Corrige tú lo que no requiera decisión de negocio (redacción, Gherkin mal formado) y vuelve a validar. Lo que sí la requiera pasa a la siguiente ronda como pregunta.

### 1.4 Revisar con el PO

Muestra un **resumen compacto**:

| ID provisional | Título | Puntos | INVEST | DoR | Depende de |
|---|---|---|---|---|---|

Debajo, el detalle de cada historia y las preguntas pendientes. Pregunta: **aprobar**, **cambiar** (qué) o **descartar** historias concretas.

- Si se aprueba todo → paso 2.
- Si hay cambios → nueva ronda.
- **Al agotar las rondas**, no sigas iterando: presenta el estado actual y pregunta si persistir solo las historias que cumplen la DoR, persistir todo marcando las que no la cumplen, o parar. Las historias que no cumplen la DoR nunca se presentan como listas.

## 2. Persistir `⏸`

Muestra exactamente qué se va a crear y dónde (Jira: proyecto y tipos; local: rutas de los ficheros) y pide confirmación.

Orden:
1. `crearEpica` (si hay épica).
2. `crearHistoria` para cada historia, con `epica` y `puntos`.
3. Dependencias. En Jira, enlaces *Blocks* (adaptador); en local, `dependencias:` en el frontmatter.

- Para cada historia, busca duplicados antes de crearla (contrato del tracker). Si existe una muy parecida, pregunta si actualizarla en lugar de crear otra.
- Si una creación falla a mitad, **detente**. Informa de lo creado y lo pendiente, sin reintentar en bucle.
- En **local**, los ficheros nuevos en `specs/` quedan sin commit. Ofrece (`⏸`) un commit `docs(<clave-épica o primera historia>): planifica <título corto>`.

## 3. Informe

Según `referencias/informe.md` (ID = clave de la épica o `_plan-<slug>`, fase `planifica`). En *Resultados*:
- La tabla final con las claves reales y los enlaces.
- La validación INVEST/DoR de cada historia.
- El razonamiento de la estimación (una línea por historia).
- El número de rondas usadas.

En *Hallazgos*: riesgos, supuestos y preguntas abiertas para negocio.

**Siguientes pasos:** `/desarrolla <clave>` para la primera historia sin dependencias pendientes.

## Referencias bajo demanda

| Cargar | Cuando |
|---|---|
| `referencias/protocolo-comun.md` | Siempre, al empezar |
| `referencias/gherkin.md`, `referencias/ejemplos.md` | Al proponer |
| `referencias/estimacion.md` | Al estimar o dividir |
| `referencias/invest.md`, `referencias/convenciones/dor-dod.md` | Al validar |
| `referencias/adaptadores/tracker-<modo>.md` | Al buscar duplicados y al persistir |
| `referencias/informe.md` | Al terminar |
