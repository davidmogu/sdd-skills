#!/bin/bash
# Repo Node mínimo para las evals. Se ejecuta en el workspace vacío de la eval (cwd).
set -euo pipefail
git init -q -b main
git config user.email "eval@example.com"
git config user.name "Eval SDD"
mkdir -p src test
cat > package.json <<'J'
{
  "name": "tienda",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test", "lint": "node --check src/pedidos.js" }
}
J
cat > src/pedidos.js <<'J'
export function filtrarPorEstado(pedidos, estado) {
  return pedidos.filter((p) => p.estado === estado);
}
J
cat > test/pedidos.test.js <<'J'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtrarPorEstado } from '../src/pedidos.js';

test('filtra por estado', () => {
  const pedidos = [{ id: 1, estado: 'pendiente' }, { id: 2, estado: 'enviado' }];
  assert.deepEqual(filtrarPorEstado(pedidos, 'enviado'), [{ id: 2, estado: 'enviado' }]);
});
J
printf 'node_modules/\n.sdd/specs/\n.sdd/reports/\n' > .gitignore
git add -A && git commit -q -m "chore: proyecto inicial"
