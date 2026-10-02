# Criterios de aceptación en Gherkin

Los criterios son el **contrato** de la historia: `/desarrolla` los mapea a tareas y tests, `/revisa` comprueba que el código los cumple y `/prueba` los convierte en tests e2e. Tienen que ser precisos.

## Formato

Palabras clave en el idioma de la config. En español: `Escenario`, `Esquema del escenario`, `Antecedentes`, `Dado`, `Cuando`, `Entonces`, `Y`, `Pero`, `Ejemplos`.

```gherkin
Escenario: <comportamiento concreto, en una frase>
  Dado <contexto / estado inicial>
  Y <más contexto, si hace falta>
  Cuando <una única acción del usuario o evento>
  Entonces <resultado observable>
  Y <otro resultado observable>
```

## Reglas

1. **Un comportamiento por escenario**, con un solo `Cuando`. Si necesitas dos acciones, son dos escenarios.
2. **El `Entonces` es observable** desde fuera: lo que el usuario ve, un dato guardado, un mensaje, un código HTTP. Nunca "el sistema procesa correctamente".
3. **Valores concretos**, no vaguedades: `"en menos de 2 segundos"` en lugar de `"rápido"`, `"máximo 50 caracteres"` en lugar de `"un nombre corto"`.
4. **Lenguaje de negocio, no de interfaz técnica**: `Cuando filtro por fecha` en lugar de `Cuando hago clic en #btn-filter`. Los selectores son cosa de `/prueba`.
5. **Cubre**:
   - El camino feliz.
   - Al menos un caso de **error o validación**.
   - Los **límites** relevantes (vacío, máximo, fechas en el borde, permisos).
6. Con más de 2 o 3 variantes del mismo comportamiento, usa **Esquema del escenario** + `Ejemplos`.
7. Entre 2 y 6 escenarios por historia. Más de 6 suele indicar que la historia es grande: valora dividirla.

## Esquema del escenario

```gherkin
Esquema del escenario: Validación del rango de fechas
  Dado que estoy en el listado de pedidos
  Cuando filtro desde "<desde>" hasta "<hasta>"
  Entonces veo el mensaje "<mensaje>"

  Ejemplos:
    | desde      | hasta      | mensaje                                  |
    | 2026-10-05 | 2026-10-01 | La fecha inicial debe ser anterior       |
    |            | 2026-10-01 | Indica la fecha inicial                  |
```

## Antipatrones

| ❌ Mal | ✅ Bien |
|---|---|
| `Entonces el filtro funciona` | `Entonces solo veo los pedidos con envío entre el 1 y el 2 de octubre` |
| `Cuando relleno el formulario y pulso guardar y vuelvo al listado` | Tres pasos → un `Cuando` (guardar) y el resto en `Dado` / `Entonces` |
| `Dado que la tabla orders tiene la columna shipped_at` | `Dado que hay pedidos con fecha de envío` |
| `Entonces la respuesta es rápida` | `Entonces la lista se muestra en menos de 2 segundos con 10 000 pedidos` |
