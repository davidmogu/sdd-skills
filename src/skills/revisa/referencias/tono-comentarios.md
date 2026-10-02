# Tono de los comentarios

El objetivo es que el autor entienda el problema y pueda corregirlo rápido, sin sentirse atacado.

## Reglas

1. **Sobre el código, no sobre la persona:** *"esta función no comprueba nulos"*, no *"no has comprobado nulos"*.
2. **Qué → por qué → propuesta.** Sin el *por qué*, el comentario parece arbitrario; sin propuesta, deja el trabajo al autor.
3. **Concreto:** cita el valor, el caso o la línea. *"Con `desde > hasta` devuelve una lista vacía en lugar del error del escenario E3"*.
4. **Propón código** cuando la corrección sea corta (bloque `suggestion` en GitHub o un fragmento normal).
5. **Pregunta cuando no estés seguro:** *"¿Es intencionado que…? Si no, …"*. Mejor que afirmar un falso positivo.
6. **Reconoce lo bueno** en el resumen, en una línea y sin relleno.
7. Sin sarcasmo, sin "obviamente", sin "simplemente".
8. En el idioma de la config.

## Ejemplos

❌ *"Esto está mal."*
✅ *"**[importante]** El filtro compara cadenas de fecha sin zona horaria: un pedido del 2 de octubre a las 00:30 en Madrid cae el día 1 en UTC y no aparece (escenario E4). Propuesta: convertir con la zona de la tienda antes de comparar."*

❌ *"¿Por qué no usas la utilidad de fechas?"*
✅ *"**[sugerencia]** Existe `utils/fechas.js#enZonaTienda` que ya hace esta conversión; reutilizarla evitaría duplicar la lógica."*
