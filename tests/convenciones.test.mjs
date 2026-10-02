import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

const leer = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

// Extrae la regex del primer bloque ``` que empieza por ^ en el documento.
async function regexDe(doc) {
  const m = (await leer(doc)).match(/```\n(\^.*\$)\n```/);
  assert.ok(m, `no se encontró la regex en ${doc}`);
  return new RegExp(m[1]);
}

test('regex de ramas (convenciones/ramas.md)', async () => {
  const re = await regexDe('src/shared/convenciones/ramas.md');
  for (const ok of ['feature/HU-007-filtrar-pedidos-fecha-envio', 'hotfix/PROJ-12-login', 'chore/AB2-1-x'])
    assert.match(ok, re);
  for (const mal of ['feature/hu-007-filtro', 'feature/HU-007', 'feat/HU-007-filtro', 'feature/HU-007-Filtro', 'feature/HU-007-filtro-', 'HU-007-filtro'])
    assert.doesNotMatch(mal, re);
});

test('regex de commits (convenciones/commits.md)', async () => {
  const re = await regexDe('src/shared/convenciones/commits.md');
  for (const ok of ['feat(PROJ-123): añade filtro por rango de fechas en pedidos', 'fix(HU-7)!: corrige zona horaria', 'test(HU-7): cubre fechas límite'])
    assert.match(ok, re);
  for (const mal of ['feat: añade filtro', 'feat(proj-123): añade filtro', 'Feat(PROJ-1): añade', 'feat(PROJ-1): Añade filtro', 'feat(PROJ-1): añade filtro.', 'feature(PROJ-1): añade', `feat(PROJ-1): ${'a'.repeat(80)}`])
    assert.doesNotMatch(mal, re);
});

test('la historia local de ejemplo cumple el formato de tracker-local.md', async () => {
  const texto = await leer('tests/fixtures/specs/HU-007.md');
  const fm = parse(texto.match(/^---\n([\s\S]*?)\n---\n/)[1]);
  for (const campo of ['id', 'tipo', 'titulo', 'estado', 'dependencias', 'enlaces', 'creada', 'actualizada'])
    assert.ok(campo in fm, `falta ${campo}`);
  assert.match(fm.id, /^[A-Z][A-Z0-9]*-[0-9]{3,}$/);
  assert.ok(['epica', 'historia', 'bug'].includes(fm.tipo));
  assert.ok(['por_hacer', 'en_curso', 'en_revision', 'hecho'].includes(fm.estado));
  assert.ok([1, 2, 3, 5, 8, 13].includes(fm.puntos));
  assert.match(texto, /\*\*Como\*\*[\s\S]*\*\*quiero\*\*[\s\S]*\*\*para\*\*/);
  assert.match(texto, /## Criterios de aceptación\n+```gherkin\n[\s\S]*Dado[\s\S]*Cuando[\s\S]*Entonces/);
});
