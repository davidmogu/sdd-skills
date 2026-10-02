---
name: prueba
description: Valida los criterios de aceptación de una historia de punta a punta - ejecución exploratoria en el navegador vía MCP (Playwright o Claude in Chrome) con evidencias, generación de tests Playwright versionados y bugs para los fallos.
argument-hint: "[ID de la historia]"
disable-model-invocation: true
---

# /prueba

Comprueba en la aplicación real que la historia cumple sus criterios y deja **tests e2e automatizados** para que no vuelva a romperse.

Historia: `$ARGUMENTS`. Si está vacío, intenta deducirla de la rama actual (`*/<ID>-*`); si no, pídela.

## 0. Arranque

Sigue `referencias/protocolo-comun.md`. En `local-degradado`, todo funciona salvo la creación de bugs en el tracker, que se anotan en *Sin sincronizar*.

## 1. Casos de prueba

1. `obtenerHistoria(<ID>)`. Sin criterios en Gherkin no hay base para probar: detente y sugiere `/planifica <ID>`.
2. Deriva los casos con `plantillas/caso-e2e.md`:
   - Un caso por `Escenario`.
   - En un `Esquema del escenario`, un caso por fila de `Ejemplos`.
   - Numéralos `E1`, `E2`… igual que en `/desarrolla`.
3. Para cada `Dado`, decide **cómo preparar los datos**: datos semilla del proyecto, usuarios de prueba, la propia UI o la API. Si no lo sabes, pregunta una vez para todos los casos. Nunca uses datos personales reales.

Si un criterio no es comprobable en la UI (p. ej. "se envía un email"), márcalo como *fuera de e2e* con el motivo y sigue con el resto.

## 2. Entorno `⏸`

1. Comprueba que `e2e.url_base` responde:
   ```bash
   curl -s -o /dev/null -w '%{http_code}' --max-time 5 <url_base>
   ```
   Si no responde, pide al usuario que **levante la aplicación** (no la arranques tú) o que indique otra URL.
2. **Seguridad:** si la URL no es local (`localhost`, `127.0.0.1` o `*.local`), avisa de que la prueba puede crear o modificar datos en ese entorno. Pide confirmación explícita. **Nunca** pruebes contra producción.
3. Credenciales de prueba: si hacen falta, pide que el usuario inicie sesión en el navegador o que las ponga en variables de entorno. No las escribas en ficheros ni en el informe.

## 3. Ejecución exploratoria

Sigue `referencias/exploratoria-mcp.md`. En resumen:
- **MCP de navegador** según `e2e.navegador_mcp` (`auto`: Playwright MCP si está disponible; si no, Claude in Chrome). Si no hay ninguno, salta al paso 4 y anótalo.
- Ejecuta cada caso paso a paso como lo haría un usuario. Captura **evidencia** (captura o GIF) del `Entonces` en `<rutas.informes>/<ID>/evidencias/`.
- **Anota los selectores accesibles** observados (rol + nombre, etiqueta, texto): serán la base de los tests generados.
- Resultado por caso: ✅ cumple, ❌ no cumple (qué se esperaba y qué pasó) o ⚠️ bloqueado (no se pudo ejecutar y por qué).

## 4. Generar tests Playwright

Sigue `referencias/playwright-generacion.md`:
1. **Playwright disponible:**
   - En proyectos Node: `npx --no-install playwright --version`. Si falta, ofrece instalarlo (`⏸`): `npm i -D @playwright/test` y `npx playwright install chromium`.
   - En otros stacks, consulta la referencia: Python usa `pytest-playwright`; en el resto solo quedan los casos documentados.
2. **Un fichero por historia** en `e2e.ruta_tests` con `plantillas/test-playwright.spec.ts`: un `test` por caso, nombrado `E<n> · <escenario>` y etiquetado `@<ID>`.
3. **Selectores accesibles** (`getByRole`, `getByLabel`, `getByText`), nunca CSS frágil ni XPath.
4. Si el fichero de la historia ya existe, **actualízalo**: añade los casos que falten y conserva los ajustes manuales.

## 5. Ejecutar los tests generados

```bash
npx playwright test <fichero> --reporter=line
```

(o `comandos.test_e2e`, acotado al fichero).

- **Fallo del test** (selector, espera, datos): corrígelo, con un máximo de `desarrollo.max_intentos_correccion` intentos.
- **Fallo de la aplicación** (coincide con un ❌ de la exploratoria): **no** "arregles" el test para que pase. Márcalo con `test.fixme` y un comentario con la clave del bug (paso 6), para que el CI no quede en rojo y el fallo quede trazado.
- **Flaky** (pasa y falla sin cambios): ejecútalo 3 veces (`--repeat-each=3`). Si persiste, corrige la causa (esperas, datos compartidos); nunca subas un `timeout` a ciegas.

## 6. Bugs `⏸`

Por cada caso ❌ de la aplicación, ofrece `crearBug` con `plantillas/bug.md`: pasos para reproducir, resultado esperado (el `Entonces`), resultado obtenido, evidencias (rutas locales; en Jira, adjúntalas solo si el usuario lo pide) e historia relacionada.

## 7. Commit `⏸`

Si estás en la rama de la historia, ofrece un commit de los tests: `test(<ID>): añade pruebas e2e de los criterios`. Si estás en la rama base, avísalo y no hagas commit sin confirmación expresa. Las evidencias **no** se versionan (están en `.sdd/reports/`).

## 8. Informe

Según `referencias/informe.md` (ID de la historia, fase `prueba`). En *Resultados*, la matriz:

| # | Escenario | Exploratoria | Test automatizado | Evidencia | Bug |
|---|---|---|---|---|---|

Añade además el fichero de tests y la salida resumida de la ejecución.

**Siguientes pasos:**
- Con bugs → corregir con `/desarrolla <BUG>` y volver a `/prueba <ID>`.
- Sin bugs → DoD-6 cumplido; `/documenta <ID>` si falta.

## Referencias bajo demanda

| Cargar | Cuando |
|---|---|
| `referencias/protocolo-comun.md` | Siempre, al empezar |
| `plantillas/caso-e2e.md` | Paso 1 |
| `referencias/exploratoria-mcp.md` | Paso 3 |
| `referencias/playwright-generacion.md`, `plantillas/test-playwright.spec.ts` | Pasos 4 y 5 |
| `referencias/adaptadores/tracker-<modo>.md`, `plantillas/bug.md` | Pasos 1 y 6 |
| `referencias/convenciones/commits.md` | Paso 7 |
| `referencias/informe.md` | Paso 8 |
