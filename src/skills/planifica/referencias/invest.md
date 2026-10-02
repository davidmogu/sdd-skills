# Rúbrica INVEST

Evalúa cada letra con `pasa`, `aviso` o `falla` y **un motivo concreto** (no "parece correcta"). Una historia es válida si no tiene ninguna `falla`; los `aviso` se muestran al PO, pero no bloquean.

| Letra | Pregunta | `pasa` | `aviso` | `falla` |
|---|---|---|---|---|
| **I** · Independiente | ¿Se puede desarrollar y entregar sin esperar a otra historia del mismo lote? | Sin dependencias o solo de historias ya hechas | Depende de otra del lote, pero el orden está claro y explícito | Dependencia circular, o solo aporta valor junto a otra (deberían ser una o estar cortadas de otra forma) |
| **N** · Negociable | ¿Describe el *qué* y el *para qué*, dejando el *cómo* al equipo? | Sin detalles de implementación | Menciona tecnología por una restricción real y justificada | Dicta la solución técnica ("crear tabla X", "usar Redux") sin necesidad de negocio |
| **V** · Valiosa | ¿Un usuario o el negocio nota la diferencia al terminarla? | El *para* expresa un beneficio observable | El beneficio es indirecto (habilitador técnico) y está explicado | Sin *para*, o el *para* repite el *quiero* ("para poder filtrar") |
| **E** · Estimable | ¿El equipo podría estimarla con la información disponible? | Alcance y reglas claros | Hay incertidumbre acotada (anotar el supuesto) | Faltan datos esenciales o reglas sin definir → pregunta al PO |
| **S** · Pequeña (*Small*) | ¿Cabe holgadamente en un sprint? | ≤ 5 puntos | 8 puntos | > `planificacion.max_puntos` (8 por defecto) → dividir |
| **T** · Testeable | ¿Se puede comprobar objetivamente que está hecha? | Todos los escenarios tienen un *Entonces* observable | Algún valor está por concretar (anotar cuál) | Criterios vagos ("rápido", "fácil", "funciona bien") o ausentes |

## Formato en el informe

```markdown
**HU-007 · Filtrar pedidos por fecha** — 3 pts — INVEST ✅ (1 aviso)
| I | N | V | E | S | T |
|---|---|---|---|---|---|
| pasa | pasa | pasa | aviso: zona horaria por confirmar | pasa | pasa |
```
