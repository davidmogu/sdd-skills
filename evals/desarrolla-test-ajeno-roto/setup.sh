#!/bin/bash
# Scaffold de la eval: se ejecuta en el workspace vacío (cwd).
set -euo pipefail
source "$(dirname "$0")/../_comun/repo-node.sh"
source "$(dirname "$0")/../_comun/config-local.sh"
source "$(dirname "$0")/../_comun/historia-hu001.sh"
cat > test/legado.test.js <<'J'
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('cálculo legado de impuestos', () => { assert.equal(0.1 + 0.2, 0.3); });
J
git add test && git commit -q -m "test: legado"
