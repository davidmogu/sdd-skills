# Ejemplos: de idea a historias

## Idea

> "Los del almacén necesitan ver solo los pedidos que tienen que enviar hoy."

### Preguntas de la ronda 1 (las que bloquean)

1. ¿"Hoy" según qué zona horaria: la de la tienda o la del usuario?
2. ¿Se filtra por fecha de envío prevista o por fecha de creación?
3. ¿Hace falta elegir otros días o solo "hoy"?
4. ¿Los pedidos cancelados deben aparecer?

### Resultado tras refinar (respuestas: tienda, envío previsto, rango libre, sin cancelados)

**Épica HU-002 · Preparación de envíos por fecha**

**HU-007 · Filtrar pedidos por rango de fechas de envío** — 3 pts

**Como** responsable de almacén
**quiero** filtrar los pedidos por fecha de envío prevista
**para** preparar solo los envíos de los días que me tocan.

```gherkin
Escenario: Filtro por un rango válido
  Dado que hay pedidos con envío previsto el 1 y el 3 de octubre
  Cuando filtro del 1 al 2 de octubre
  Entonces solo veo los pedidos con envío el 1 de octubre

Escenario: Los cancelados no aparecen
  Dado que hay un pedido cancelado con envío el 1 de octubre
  Cuando filtro del 1 al 2 de octubre
  Entonces ese pedido no aparece en el listado

Escenario: Rango invertido
  Cuando filtro del 5 al 1 de octubre
  Entonces veo el mensaje "La fecha inicial debe ser anterior a la final"
  Y el listado no cambia

Escenario: Fechas según la zona horaria de la tienda
  Dado que la tienda está en Europe/Madrid
  Y hay un pedido con envío el 2 de octubre a las 00:30 hora de Madrid
  Cuando filtro del 2 al 2 de octubre
  Entonces veo ese pedido
```

INVEST: todo `pasa`. Estimación: *"3 pts: reutiliza el listado existente; la regla de zona horaria añade algo de incertidumbre; UI + API."*

**HU-008 · Acceso rápido a "Envíos de hoy"** — 2 pts (depende de HU-007)

## Antiejemplo y corrección

❌ **"Como desarrollador quiero añadir un índice en shipped_at para que la consulta sea rápida"**
- **V falla:** el beneficio es técnico y no se explica para quién.
- **N falla:** dicta la solución (el índice).
- **T falla:** "rápida" no es verificable.

✅ Reformulada como criterio de HU-007:

```gherkin
Escenario: Rendimiento con volumen real
  Dado que hay 50 000 pedidos en los últimos 90 días
  Cuando filtro un rango de 7 días
  Entonces el listado se muestra en menos de 2 segundos
```

El índice será una decisión del equipo en `/desarrolla`.
