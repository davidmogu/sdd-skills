#!/usr/bin/env node
// Arnés local para los casos de evals/ cuando el sandbox de `claude plugin eval` no puede
// conceder Bash (p. ej. macOS con los enlaces de Docker Desktop en ~/.docker/cli-plugins).
// Ejecuta cada caso con `claude -p --plugin-dir` en un workspace temporal, evalúa los graders
// deterministas (file_exists, regex, tool_used) y deja los `llm` como pendientes de juicio.
//
//   node evals/_arnes/ejecutar.mjs [--dir evals/_jira] [--case <glob>] [--tag <tag>] [-j 4] [--max-cost-usd 8] [--model <m>]
//
// ⚠️ Cuesta dinero o cuota: cada caso es una sesión de Claude. Sin el aislamiento del sandbox:
// úsalo solo con casos propios.

import { spawn, execFileSync } from 'node:child_process';
import { existsSync, globSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync, createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';

const RAIZ = resolve(new URL('../..', import.meta.url).pathname);
const EVALS = join(RAIZ, 'evals');
const DIR_CASOS = resolve(process.argv.includes('--dir') ? process.argv[process.argv.indexOf('--dir') + 1] : EVALS);
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const CONC = Number(opt('-j', 4));
const TOPE = Number(opt('--max-cost-usd', 8));
const MODELO = opt('--model');
const filtroCaso = opt('--case');
const filtroTag = opt('--tag');
const comoRegex = (g) => new RegExp(`^${g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);

const casos = readdirSync(DIR_CASOS)
  .filter((d) => existsSync(join(DIR_CASOS, d, 'case.yaml')))
  .map((d) => ({ dir: join(DIR_CASOS, d), cfg: parse(readFileSync(join(DIR_CASOS, d, 'case.yaml'), 'utf8')) }))
  .filter(({ cfg }) => (!filtroCaso || comoRegex(filtroCaso).test(cfg.name)) && (!filtroTag || cfg.tags.includes(filtroTag)));

const salida = join(EVALS, 'results', `local-${new Date().toISOString().replace(/[:.]/g, '-')}`);
if (!args.includes('--regrade')) mkdirSync(salida, { recursive: true });
let gastado = 0;

function ejecutarCaso({ dir, cfg }) {
  return new Promise((fin) => {
    const ws = mkdtempSync(join(tmpdir(), `sdd-eval-${cfg.name}-`));
    const res = { caso: cfg.name, ws, graders: [], coste: 0, turnos: 0, error: null };
    try {
      execFileSync('bash', [join(dir, cfg.context.scaffold_script)], {
        cwd: ws, stdio: 'pipe', env: { PATH: process.env.PATH, HOME: ws, TMPDIR: tmpdir(), TERM: 'dumb' },
      });
    } catch (e) {
      res.error = `scaffold: ${e.stderr?.toString().slice(0, 300)}`;
      return fin(res);
    }
    const prompt = readFileSync(join(dir, 'prompt.md'), 'utf8').replace(/^---[\s\S]*?---\n/, '').trim();
    const ex = cfg.execution;
    const argv = [
      '-p', prompt, '--plugin-dir', RAIZ, '--output-format', 'stream-json', '--verbose',
      '--max-turns', String(ex.max_turns), '--append-system-prompt', ex.append_system_prompt,
      '--allowedTools', ex.allowed_tools.join(' '), '--disallowedTools', 'AskUserQuestion',
    ];
    if (MODELO) argv.push('--model', MODELO);
    const dirCaso = join(salida, cfg.name);
    mkdirSync(dirCaso, { recursive: true });
    const traza = createWriteStream(join(dirCaso, 'trace.jsonl'));
    const hijo = spawn('claude', argv, { cwd: ws, stdio: ['ignore', 'pipe', 'pipe'] });
    const lineas = [];
    let resto = '';
    hijo.stdout.on('data', (b) => {
      traza.write(b);
      const partes = (resto + b.toString()).split('\n');
      resto = partes.pop();
      for (const l of partes) if (l.trim()) { try { lineas.push(JSON.parse(l)); } catch { /* línea parcial */ } }
    });
    let stderr = '';
    hijo.stderr.on('data', (b) => { stderr += b; });
    const reloj = setTimeout(() => { res.error = `timeout ${ex.timeout_seconds}s`; hijo.kill('SIGTERM'); }, ex.timeout_seconds * 1000);
    hijo.on('close', () => {
      clearTimeout(reloj);
      traza.end();
      const final = lineas.findLast((m) => m.type === 'result');
      res.coste = final?.total_cost_usd ?? 0;
      res.turnos = final?.num_turns ?? 0;
      res.ultimo = final?.result ?? '';
      if (!final && !res.error) res.error = `sin resultado: ${stderr.slice(0, 300)}`;
      gastado += res.coste;
      const usos = lineas.filter((m) => m.type === 'assistant').flatMap((m) => m.message?.content ?? []).filter((c) => c.type === 'tool_use');
      const textoTraza = lineas.map((m) => JSON.stringify(m)).join('\n');
      for (const g of cfg.graders) res.graders.push({ nombre: g.name, tipo: g.type, peso: g.weight ?? 1, ...evaluar(g, { ws, usos, textoTraza, ultimo: res.ultimo }) });
      writeFileSync(join(dirCaso, 'resultado.json'), JSON.stringify(res, null, 2));
      fin(res);
    });
  });
}

function objetivo(t, ctx) {
  if (t === 'trace') return ctx.textoTraza;
  if (t === 'last_message' || !t) return ctx.ultimo;
  if (t?.source === 'file') { const p = join(ctx.ws, t.path); return existsSync(p) ? readFileSync(p, 'utf8') : null; }
  return null;
}

function evaluar(g, ctx) {
  switch (g.type) {
    case 'file_exists': {
      const hay = globSync(g.path, { cwd: ctx.ws }).length > 0;
      return { pasa: hay === (g.exists ?? true) };
    }
    case 'regex': {
      const texto = objetivo(g.target, ctx);
      if (texto === null) return { pasa: false, detalle: 'objetivo inexistente' };
      const n = (texto.match(new RegExp(g.pattern, `${g.flags ?? ''}g`)) ?? []).length;
      return { pasa: g.match === 'not_contains' ? n === 0 : n > 0 };
    }
    case 'tool_used': {
      const re = g.input_match ? new RegExp(g.input_match) : null;
      let n = ctx.usos.filter((u) => u.name === g.tool && (!re || re.test(JSON.stringify(u.input)))).length;
      // Con `claude -p "/sdd:x"` el comando se expande sin llamar a la herramienta Skill: cuenta
      // como invocación cualquier uso de herramienta que lea ficheros de skills/<x>/.
      if (g.tool === 'Skill' && n === 0 && g.input_match) {
        n = ctx.usos.filter((u) => new RegExp(`skills/${g.input_match}\\b`).test(JSON.stringify(u.input))).length;
      }
      return { pasa: n >= (g.min ?? 1) && n <= (g.max ?? Infinity), detalle: `${n} usos` };
    }
    case 'llm':
      return { pasa: null, detalle: 'pendiente de juicio', criterio: g.criteria };
    default:
      return { pasa: null, detalle: `tipo ${g.type} no soportado por el arnés` };
  }
}

// --regrade <dir>: recalcula los graders deterministas con las trazas guardadas (sin coste).
function regradar(dir) {
  for (const c of casos) {
    const rutaRes = join(dir, c.cfg.name, 'resultado.json');
    if (!existsSync(rutaRes)) continue;
    const res = JSON.parse(readFileSync(rutaRes, 'utf8'));
    const lineas = readFileSync(join(dir, c.cfg.name, 'trace.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const usos = lineas.filter((m) => m.type === 'assistant').flatMap((m) => m.message?.content ?? []).filter((x) => x.type === 'tool_use');
    const ctx = { ws: res.ws, usos, textoTraza: lineas.map((m) => JSON.stringify(m)).join('\n'), ultimo: res.ultimo };
    res.graders = c.cfg.graders.map((g) => ({ nombre: g.name, tipo: g.type, peso: g.weight ?? 1, ...evaluar(g, ctx) }));
    writeFileSync(rutaRes, JSON.stringify(res, null, 2));
    const det = res.graders.filter((g) => g.pasa !== null);
    const fallos = det.filter((g) => !g.pasa).map((g) => g.nombre);
    console.log(`${c.cfg.name.padEnd(30)} ${det.length - fallos.length}/${det.length}${fallos.length ? `  ✖ ${fallos.join(', ')}` : ''}`);
  }
}

async function main() {
  if (opt('--regrade')) return regradar(resolve(opt('--regrade')));
  console.log(`${casos.length} casos · concurrencia ${CONC} · tope ${TOPE} $ · resultados en ${salida}`);
  const cola = [...casos];
  const resultados = [];
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (cola.length) {
      if (gastado >= TOPE) { console.log(`Tope de ${TOPE} $ alcanzado: no se lanzan más casos.`); return; }
      const c = cola.shift();
      const r = await ejecutarCaso(c);
      resultados.push(r);
      const det = r.graders.filter((g) => g.pasa !== null);
      console.log(`${r.error ? '✖' : '·'} ${r.caso.padEnd(30)} ${det.filter((g) => g.pasa).length}/${det.length} deterministas · ${r.turnos} turnos · ${r.coste.toFixed(2)} $${r.error ? ` · ${r.error}` : ''}`);
    }
  }));
  writeFileSync(join(salida, 'resumen.json'), JSON.stringify({ gastado, resultados }, null, 2));
  console.log(`Total: ${gastado.toFixed(2)} $ · ${resultados.length}/${casos.length} casos ejecutados · ${salida}/resumen.json`);
}

main();
