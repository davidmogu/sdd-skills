import { test, expect } from '@playwright/test';

// Generado con /prueba (SDD) a partir de los criterios de <ID>.
// Los ajustes manuales se conservan al volver a ejecutar /prueba.

const URL_BASE = process.env.E2E_URL_BASE ?? '<e2e.url_base>';

test.describe('<ID> · <título> @<ID>', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL_BASE);
  });

  test('E1 · <escenario>', async ({ page }) => {
    // Dado <contexto>

    // Cuando <acción>
    await page.getByRole('button', { name: '<nombre accesible>' }).click();

    // Entonces <resultado observable>
    await expect(page.getByText('<texto literal del Gherkin>')).toBeVisible();
  });
});
