# Generación de tests Playwright

## Stack

| Proyecto | Qué generar |
|---|---|
| Node (hay `package.json`) | `@playwright/test` en TypeScript (`.spec.ts`), o en JavaScript (`.spec.js`) si el proyecto no usa TS |
| Python | `pytest-playwright` (`test_<id>_<slug>.py`), con las mismas reglas de nombres y selectores |
| Otros (Java, .NET…) | No se generan tests en la v1: los casos quedan documentados en el informe y se sugiere la librería oficial de Playwright para ese lenguaje |

Si el proyecto ya tiene tests e2e con **otra herramienta** (Cypress, Selenium…), pregunta si generar con esa en lugar de Playwright. Mantener dos frameworks e2e no suele compensar.

## Fichero

- Ruta: `<e2e.ruta_tests><id-en-minúsculas>-<slug>.spec.ts` (slug como en las ramas). Ejemplo: `e2e/hu-007-filtrar-pedidos-fecha.spec.ts`.
- Si existe `playwright.config.*`, respeta su `testDir`, su `baseURL` y sus proyectos. Si no existe, no lo crees sin preguntar; los tests usan la URL completa a partir de `e2e.url_base`.

## Estructura

```ts
import { test, expect } from '@playwright/test';

test.describe('HU-007 · Filtrar pedidos por fecha @HU-007', () => {
  test.beforeEach(async ({ page }) => {
    // Preparación común (Antecedentes / Dado repetidos)
  });

  test('E1 · Filtro por un rango válido', async ({ page }) => {
    // Dado …
    // Cuando …
    await page.getByLabel('Desde').fill('2026-10-01');
    await page.getByRole('button', { name: 'Filtrar' }).click();
    // Entonces …
    await expect(page.getByRole('row', { name: /pedido/i })).toHaveCount(1);
  });
});
```

## Reglas

1. **Un `test` por caso**, con el nombre `E<n> · <escenario>` y comentarios `// Dado`, `// Cuando`, `// Entonces` para que se lean como el Gherkin.
2. **Selectores por accesibilidad**, en este orden: `getByRole(rol, { name })` → `getByLabel` → `getByPlaceholder` → `getByText` → `getByTestId`. Prohibidos los selectores CSS de estructura (`div > span:nth-child(3)`) y XPath.
3. **Aserciones web-first** (`await expect(locator).toHaveText(...)`, `toBeVisible`, `toHaveCount`), que esperan solas. Prohibido `page.waitForTimeout`.
4. **Independientes:** cada test prepara sus datos; nada depende del orden ni de otro test. Para fechas, fija los datos de prueba en lugar de depender de "hoy" (o usa `page.clock` si el proyecto lo admite).
5. **Valores del Gherkin, literales:** si el escenario dice `"La fecha inicial debe ser anterior a la final"`, la aserción usa ese texto.
6. **Sin secretos:** credenciales desde `process.env`; si faltan, `test.skip` con el motivo.
7. **Bug conocido:** `test.fixme('E3 · …', …)` con el comentario `// BUG-012: <título>`.

## Ejecución

```bash
npx playwright test e2e/hu-007-filtrar-pedidos-fecha.spec.ts --reporter=line
npx playwright test --grep @HU-007            # todos los de la historia
```

Para depurar un fallo: `--trace on` y revisa el trace. No incluyas trazas ni vídeos en el commit.
