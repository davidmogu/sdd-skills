# Cómo hacer el plan técnico

El plan traduce la historia a trabajo concreto **en este código**. Lo aprueba el desarrollador, guía la implementación y permite retomarla. Se guarda en `<rutas.specs_locales>/<ID>/plan.md` (ignorado por git: es un documento de trabajo personal).

## 1. Analizar antes de planificar

- **Instrucciones del proyecto:** `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `README` (arquitectura, cómo se ejecuta).
- **Código afectado:** localiza dónde vive hoy la funcionalidad más parecida (búsqueda por nombres del dominio de la historia) y sigue el flujo de punta a punta (entrada → lógica → datos → salida).
- **Patrones a imitar:** cómo se nombran las cosas, dónde van los tests, qué utilidades existen (no reinventes lo que ya hay).
- **Tests existentes:** framework, ubicación, cómo se preparan los datos.
- Si el análisis es amplio, delega la búsqueda en un subagente de exploración y quédate con las conclusiones.

## 2. Diseñar las tareas

| Regla | Por qué |
|---|---|
| Cada tarea es **un commit** que compila y pasa tests | Commits atómicos; reanudación limpia |
| De 30 min a 2 h de trabajo por tarea, aprox. | Si es más grande, divídela |
| Ordenadas por dependencia: modelo/datos → lógica → API → UI | Cada paso se puede probar sobre el anterior |
| Cada tarea indica **qué criterios** cubre (`E1`, `E2`… = escenarios en orden) | Trazabilidad para el checklist y la revisión |
| Cada tarea indica **qué test** la demuestra | Sin test no hay evidencia |
| Una tarea de "limpieza" final solo si hace falta | No mezclar refactor con funcionalidad |

**Cobertura:** construye la matriz criterio → tareas. Si un criterio queda sin tarea, el plan está incompleto. Si un criterio no se puede probar automáticamente (p. ej. visual), indica cómo se evidenciará (captura con `/prueba`) y márcalo.

## 3. Decisiones y riesgos

- **Decisiones técnicas** con alternativa descartada y motivo, en una línea cada una. Ejemplo: *"Filtrar en SQL, no en memoria: volumen de 50k pedidos."*
- **Riesgos:** migraciones, cambios de contrato de API, rendimiento, seguridad, datos existentes.
- **Fuera del plan:** lo que se ha visto mejorable, pero no se toca (va al informe como deuda técnica).

## 4. Tamaño

Si el plan sale con más de ~10 tareas o toca muchas áreas, probablemente la historia es más grande de lo estimado. Avisa y sugiere dividirla con `/planifica` antes de empezar.
