import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from '../scripts/validate.mjs';

test('parseFrontmatter lee claves y quita comillas', () => {
  const fm = parseFrontmatter('---\nname: hola\nargument-hint: "[nombre]"\ndisable-model-invocation: true\n---\n# cuerpo\n');
  assert.deepEqual(fm, { name: 'hola', 'argument-hint': '[nombre]', 'disable-model-invocation': 'true' });
});

test('parseFrontmatter devuelve null sin frontmatter', () => {
  assert.equal(parseFrontmatter('# sin frontmatter\n'), null);
});
