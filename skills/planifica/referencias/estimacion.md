# Estimación en story points (Fibonacci)

Escala: **1, 2, 3, 5, 8, 13**. Los puntos miden **tamaño relativo** (complejidad + incertidumbre + volumen de trabajo), no horas. La estimación es una **sugerencia** para el refinamiento del equipo: indícalo así.

## Guía

| Puntos | Referencia |
|---|---|
| 1 | Cambio trivial y conocido: texto, validación sencilla, un campo más |
| 2 | Pequeño, con un par de piezas y sin incertidumbre |
| 3 | Funcionalidad acotada que toca varias capas (UI + API + datos), patrón conocido |
| 5 | Varias reglas de negocio o integración con algo existente; algo de incertidumbre |
| 8 | Grande: muchas reglas, integración nueva o incertidumbre notable. Límite de la DoR por defecto |
| 13 | Demasiado grande o incierta para una historia: **dividir**, o hacer antes un *spike* |

Al estimar, razona en una línea los tres factores, p. ej.: *"3 pts: patrón de filtros existente (complejidad baja), una regla de zona horaria (incertidumbre media), UI + API (volumen medio)"*.

Si hay historias ya hechas en el proyecto con puntos, úsalas como referencia (`buscarHistorias` con estado `hecho`).

## División

Si una historia supera `planificacion.max_puntos`, propón dividirla **en vertical**: cada parte aporta valor por sí misma. Nunca por capas ("backend" y "frontend").

Patrones útiles:

| Patrón | Ejemplo |
|---|---|
| Por **flujo o camino** | Camino feliz primero; errores y casos límite después |
| Por **regla de negocio** | Filtro por fecha / filtro por estado / combinación de filtros |
| Por **datos** | Un tipo de pedido primero, el resto después |
| Por **operación** (CRUD) | Consultar → crear → editar → eliminar |
| Por **rol** | Administrador primero, otros roles después |
| **Simple primero** | Versión básica; las mejoras (ordenación, exportar) en otras historias |
| **Spike** | Si la incertidumbre es técnica: una historia de investigación con tiempo acotado y un entregable (decisión documentada) |

Tras dividir, vuelve a validar cada parte con INVEST.
