# Checklist de revisión por dimensión

Revisa **lo que cambia el PR** y su impacto, no todo el fichero. Cada hallazgo necesita una ubicación y un motivo verificable en el código; sin evidencia, no hay hallazgo.

## 1. Criterios de aceptación

- [ ] Cada escenario de la historia tiene **implementación** identificable en el diff.
- [ ] Cada escenario tiene un **test** que lo ejercita (o una evidencia e2e anunciada como ⏳ en el PR).
- [ ] El comportamiento implementado coincide con el `Entonces` del escenario, incluidos valores y mensajes exactos.
- [ ] No se implementa **más** de lo pedido sin justificar (alcance oculto).
- [ ] El checklist del PR es veraz: las evidencias citadas existen y prueban lo que dicen.

Matriz para el informe: `escenario | implementación (fichero:línea) | test (fichero:línea) | estado`.

## 2. Corrección

- [ ] Casos límite: vacío, nulo, cero, negativo, máximo, unicode, fechas en los bordes y zonas horarias.
- [ ] Gestión de errores: no se tragan excepciones; los mensajes tienen sentido; se liberan recursos.
- [ ] Concurrencia y estado: condiciones de carrera, idempotencia, transacciones.
- [ ] Cambios de contrato (API, esquemas, eventos): compatibilidad hacia atrás o migración.
- [ ] Migraciones de datos: reversibles o con plan, y seguras con datos existentes.

## 3. Tests

- [ ] Prueban **comportamiento**, no detalles de implementación.
- [ ] Hay casos negativos y límites, no solo el camino feliz.
- [ ] Son deterministas: sin dependencia de hora real, red, orden ni datos compartidos.
- [ ] Los nombres describen el escenario.
- [ ] No se han desactivado, borrado ni debilitado tests existentes sin motivo.

## 4. Seguridad

- [ ] Entradas validadas; sin inyección (SQL, comandos, plantillas, rutas).
- [ ] Autorización comprobada en el servidor para cada operación nueva.
- [ ] Sin secretos en el código, los tests, los logs ni la configuración versionada.
- [ ] Datos personales: mínimos, no expuestos en logs ni respuestas.
- [ ] Dependencias nuevas: necesarias, mantenidas y sin vulnerabilidades conocidas evidentes.
- [ ] Salida escapada en la UI (XSS); CORS y cabeceras sin aperturas innecesarias.

## 5. Rendimiento

- [ ] Sin consultas N+1 ni bucles con E/S dentro.
- [ ] Consultas con filtros e índices razonables para el volumen esperado (si la historia da cifras, compruébalas).
- [ ] Sin trabajo pesado en el hilo de la UI ni en caminos críticos.
- [ ] Paginación o límites en listados.

## 6. Legibilidad y mantenibilidad

- [ ] Nombres del dominio, claros.
- [ ] Funciones con una responsabilidad; sin duplicación evitable (¿existe ya una utilidad?).
- [ ] Sigue los patrones del código vecino.
- [ ] Comentarios que explican el *por qué*; sin código comentado ni TODOs sin ticket.
- [ ] Complejidad proporcional al problema; sin abstracciones prematuras.

## 7. Convenciones

- [ ] Rama: regex de `referencias/convenciones/ramas.md`.
- [ ] Commits: regex de `referencias/convenciones/commits.md` (`git log --format=%s <base>..<sha_head>`).
- [ ] Título del PR con la clave de la historia (necesario para la integración con Jira).
- [ ] Estilo del proyecto (lint y formato). Si el CI ya lo comprueba y está en verde, no repitas hallazgos de estilo.
- [ ] Ficheros que no deberían estar: `.sdd/specs/`, `.sdd/reports/`, artefactos de build, `.env`.
