import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const EVALS = new URL('../evals/', import.meta.url).pathname;
const casos = readdirSync(EVALS).filter((d) => existsSync(join(EVALS, d, 'case.yaml')));
const SKILLS = readdirSync(new URL('../src/skills/', import.meta.url).pathname);
const TIPOS = { regex: ['pattern', 'target'], tool_used: ['tool'], tool_order: ['before', 'after'], file_exists: ['path'], llm: ['criteria'], baseline: ['baseline_file'] };

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validarConfig = ajv.compile(JSON.parse(readFileSync(new URL('../cli/schema/config.schema.json', import.meta.url), 'utf8')));

test('hay al menos 2 casos por skill y al menos un negativo en las skills con efectos', () => {
  const porSkill = Object.fromEntries(SKILLS.map((s) => [s, []]));
  for (const c of casos) {
    const cfg = parse(readFileSync(join(EVALS, c, 'case.yaml'), 'utf8'));
    const s = cfg.tags.find((t) => SKILLS.includes(t));
    assert.ok(s, `${c}: sin tag de skill`);
    porSkill[s].push(cfg.tags);
  }
  for (const [s, tags] of Object.entries(porSkill)) {
    assert.ok(tags.length >= 1, `${s}: sin casos`);
    if (['planifica', 'desarrolla'].includes(s)) assert.ok(tags.some((t) => t.includes('negativo')), `${s}: sin caso negativo`);
  }
});

for (const c of casos) {
  test(`eval ${c}: case.yaml bien formado y scaffold ejecutable`, () => {
    const dir = join(EVALS, c);
    const cfg = parse(readFileSync(join(dir, 'case.yaml'), 'utf8'));
    assert.equal(cfg.schema_version, '1.1');
    assert.equal(cfg.name, c);
    assert.ok(readFileSync(join(dir, 'prompt.md'), 'utf8').trim().startsWith('/sdd:'), 'el prompt debe invocar una skill');
    assert.ok(!cfg.execution.allowed_tools.includes('AskUserQuestion'), 'sin humano: no se permite AskUserQuestion');
    for (const g of cfg.graders) {
      assert.ok(TIPOS[g.type], `${c}/${g.name}: tipo ${g.type} desconocido`);
      for (const campo of TIPOS[g.type]) assert.ok(g[campo] !== undefined, `${c}/${g.name}: falta ${campo}`);
      if (g.max === 0) assert.equal(g.min, 0, `${c}/${g.name}: max 0 requiere min 0`);
      if (g.type === 'regex') new RegExp(g.pattern, g.flags);
    }
    const script = join(dir, cfg.context.scaffold_script);
    assert.ok(statSync(script).mode & 0o100, 'scaffold no ejecutable');

    // Ejecuta el scaffold como lo haría la eval: en un workspace vacío, con HOME temporal
    const ws = mkdtempSync(join(tmpdir(), `sdd-eval-${c}-`));
    try {
      execFileSync('bash', [script], { cwd: ws, env: { PATH: process.env.PATH, HOME: ws, TMPDIR: tmpdir(), TERM: 'dumb' }, stdio: 'pipe' });
      assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: ws, encoding: 'utf8' }), '', 'el scaffold debe dejar el árbol limpio');
      const cfgRepo = join(ws, '.sdd/config.yml');
      if (existsSync(cfgRepo)) assert.ok(validarConfig(parse(readFileSync(cfgRepo, 'utf8'))), `config del scaffold inválida: ${ajv.errorsText(validarConfig.errors)}`);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });
}
