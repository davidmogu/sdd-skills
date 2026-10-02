# Ejecución exploratoria con un MCP de navegador

## Elegir el navegador

| `e2e.navegador_mcp` | Uso |
|---|---|
| `playwright` | Playwright MCP: herramientas con `playwright` en el nombre (`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_take_screenshot`…) |
| `claude-in-chrome` | Claude in Chrome: herramientas `mcp__claude-in-chrome__*`. Antes de usarlas, sigue su skill si está disponible. Trabaja en una **pestaña nueva**, nunca en las del usuario |
| `auto` | Playwright MCP si está disponible; si no, Claude in Chrome; si no, ninguno |

Si las herramientas están diferidas, cárgalas **todas en una sola** búsqueda de herramientas.

**Por qué preferir Playwright MCP:** navegador aislado sin las sesiones del usuario, y el *snapshot* de accesibilidad da directamente los roles y nombres que usarán los tests generados. Claude in Chrome usa el navegador real del usuario, con sus sesiones iniciadas: útil cuando hace falta estar autenticado, pero exige más cuidado.

## Por cada caso

1. **Preparar:** deja la aplicación en el estado del `Dado`: navega, crea los datos con la UI o con el mecanismo acordado.
2. **Actuar:** ejecuta el `Cuando` como un usuario: clics y teclado sobre elementos visibles. No llames a la API por detrás para simular la acción.
3. **Observar:** lee el estado tras la acción (*snapshot* de accesibilidad o lectura de la página) y compáralo con **cada** `Entonces`, literalmente: textos, cantidades, mensajes.
4. **Evidencia:** captura del estado final. Con Playwright MCP, `browser_take_screenshot` con `filename: <rutas.informes>/<ID>/evidencias/E<n>.png`. Con Claude in Chrome, captura de pantalla o GIF (nombre `E<n>-<slug>.gif`) si la herramienta lo permite; si no puede guardar el fichero, describe la evidencia en el informe.
5. **Selectores:** anota, para cada elemento usado, su rol y nombre accesible (`button "Filtrar"`, `textbox "Desde"`) o su etiqueta. Si un elemento no tiene nombre accesible, anótalo como hallazgo de accesibilidad (sugerencia) y usa `data-testid` si existe.
6. **Resultado:** ✅ / ❌ / ⚠️ con una línea de explicación.

## Reglas

- **No provoques diálogos** nativos (`alert`, `confirm`): bloquean la automatización. Si un caso los necesita, avísalo y márcalo como ⚠️, o prueba ese paso solo en el test generado (`page.on('dialog')`).
- **Errores de consola y red:** revísalos tras cada caso. Un error no esperado es un hallazgo aunque el `Entonces` se cumpla.
- **No borres datos** que no hayas creado tú en esta ejecución.
- **Atasco:** si un paso falla 2 o 3 veces por un problema de la herramienta (no de la aplicación), márcalo como ⚠️ y sigue con el siguiente caso. No entres en bucle.
- Al terminar, cierra las pestañas que hayas abierto.
