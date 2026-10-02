import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const dir = new URL('../src/shared/adaptadores/', import.meta.url);
const hayJq = (() => { try { execFileSync('jq', ['--version']); return true; } catch { return false; } })();

// Filtros jq entre comillas simples; se omiten los que usan variables ($x) porque necesitan --arg.
const extraer = (md) => [...md.matchAll(/\bjq(?: -[a-zA-Z]+(?: [a-z]+)?)* '([^']+)'/g)].map((m) => m[1]).filter((f) => !f.includes('$'));

for (const fichero of (await readdir(dir)).filter((f) => f.startsWith('git-'))) {
  test(`filtros jq de ${fichero} compilan`, { skip: !hayJq && 'jq no instalado' }, async () => {
    const filtros = extraer(await readFile(new URL(fichero, dir), 'utf8'));
    for (const f of filtros) {
      // "if false" compila el filtro sin ejecutarlo
      assert.doesNotThrow(() => execFileSync('jq', ['-n', `if false then (${f}) else empty end`], { stdio: 'pipe' }), `filtro inválido: ${f}`);
    }
  });
}

test('cada adaptador de hosting implementa todas las operaciones del contrato', async () => {
  const ops = ['comprobarAcceso', 'crearPR', 'obtenerPR', 'buscarPRPorRama', 'obtenerDiff', 'listarComentarios', 'publicarRevision', 'estadoCI'];
  for (const fichero of (await readdir(dir)).filter((f) => f.startsWith('git-'))) {
    const md = await readFile(new URL(fichero, dir), 'utf8');
    for (const op of ops) assert.match(md, new RegExp(`### \`${op}\\(`), `${fichero}: falta ${op}`);
  }
});

test('cada adaptador de tracker implementa todas las operaciones del contrato', async () => {
  const ops = ['obtenerHistoria', 'buscarHistorias', 'crearHistoria', 'actualizarHistoria', 'transicionar', 'vincular', 'crearBug'];
  for (const fichero of ['tracker-local.md', 'tracker-jira.md']) {
    const md = await readFile(new URL(fichero, dir), 'utf8');
    for (const op of ops) assert.match(md, new RegExp(`\`${op}`), `${fichero}: falta ${op}`);
  }
});
