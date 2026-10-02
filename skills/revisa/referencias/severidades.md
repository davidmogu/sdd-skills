# Severidades

| Severidad | Significado | Ejemplos | Efecto en el veredicto |
|---|---|---|---|
| `bloqueante` | No se puede fusionar así: rompe algo, es inseguro o no cumple la historia | Criterio no implementado o sin test; vulnerabilidad; pérdida de datos; CI en rojo; secreto en el código | *Pedir cambios* |
| `importante` | Debe corregirse en este PR salvo que haya una razón explícita | Caso límite sin cubrir que provocará errores; test frágil; N+1 con volumen real; PR sin historia vinculada; commits fuera de convención | *Pedir cambios* por defecto (el revisor puede rebajarlo) |
| `sugerencia` | Mejora recomendable, no obligatoria | Simplificación; mejor nombre; reutilizar una utilidad existente; test adicional útil | No bloquea |
| `nit` | Detalle menor o de gusto | Typo en un comentario; orden de imports no cubierto por el linter | No bloquea; agrúpalos si son muchos |

## Reglas

- **En caso de duda entre dos niveles, elige el más bajo** y explica el riesgo: es mejor que el revisor suba la severidad a que se bloquee un PR por un falso positivo.
- No conviertas preferencias personales en `importante`. Si el proyecto no tiene la regla escrita y el código vecino hace lo mismo, como mucho es `sugerencia`.
- Un mismo problema repetido en muchos sitios = **un** hallazgo con la lista de ubicaciones (o un comentario en la primera y una mención en el resumen).
