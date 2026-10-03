import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { aplicarVersion } from '../scripts/release.mjs';

function repo(changelog) {
  const r = mkdtempSync(join(tmpdir(), 'sdd-rel-'));
  mkdirSync(join(r, '.claude-plugin'));
  writeFileSync(join(r, 'package.json'), JSON.stringify({ name: 'x', version: '0.0.1' }));
  writeFileSync(join(r, '.claude-plugin/plugin.json'), JSON.stringify({ name: 'sdd', version: '0.0.1' }));
  writeFileSync(join(r, '.claude-plugin/marketplace.json'), JSON.stringify({ plugins: [{ name: 'sdd', version: '0.0.1' }] }));
  writeFileSync(join(r, 'CHANGELOG.md'), changelog);
  return r;
}

test('aplicarVersion sincroniza los tres manifiestos y cierra el changelog', () => {
  const r = repo('# Changelog\n\n## [Sin publicar]\n\n### Añadido\n- algo\n');
  aplicarVersion(r, '0.1.0', '2026-10-03');
  for (const p of ['package.json', '.claude-plugin/plugin.json']) assert.equal(JSON.parse(readFileSync(join(r, p))).version, '0.1.0');
  assert.equal(JSON.parse(readFileSync(join(r, '.claude-plugin/marketplace.json'))).plugins[0].version, '0.1.0');
  assert.match(readFileSync(join(r, 'CHANGELOG.md'), 'utf8'), /## \[Sin publicar\]\n\n## \[0\.1\.0\] - 2026-10-03\n\n### Añadido\n- algo/);
});

test('aplicarVersion rechaza versiones no semver y changelogs vacíos', () => {
  assert.throws(() => aplicarVersion(repo('## [Sin publicar]\n- x\n'), 'v1', '2026-10-03'), /no válida/);
  assert.throws(() => aplicarVersion(repo('## [Sin publicar]\n\n### Añadido\n\n## [0.0.1]\n- x\n'), '0.1.0', '2026-10-03'), /vacía/);
});
