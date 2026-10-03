import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, appendFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { init, update, ficherosPaquete, MANIFIESTO } from '../cli/lib/instalar.mjs';
import { fusionar, quitarClavesSoloRepo, configEfectiva } from '../cli/lib/config.mjs';
import { compararVersiones, detectarHosting } from '../cli/lib/doctor.mjs';

let tmp;
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'sdd-cli-'));
  process.env.HOME = join(tmp, 'home');
  delete process.env.SDD_HOME;
  mkdirSync(process.env.HOME, { recursive: true });
});

// Paquete de skills falso para controlar versiones
function paquete(nombre, ficheros) {
  const dir = join(tmp, nombre);
  for (const [f, c] of Object.entries(ficheros)) { mkdirSync(join(dir, f, '..'), { recursive: true }); writeFileSync(join(dir, f), c); }
  return dir;
}

test('init copia las skills y escribe el manifiesto', () => {
  const origen = paquete('v1', { 'a/SKILL.md': 'a1', 'a/referencias/x.md': 'x1', 'b/SKILL.md': 'b1' });
  const dest = join(tmp, 'repo/.claude/skills');
  const r = init({ dest, version: '1.0.0', origen });
  assert.ok(r.ok, r.mensaje);
  assert.equal(readFileSync(join(dest, 'a/referencias/x.md'), 'utf8'), 'x1');
  const m = JSON.parse(readFileSync(join(dest, MANIFIESTO), 'utf8'));
  assert.equal(m.version, '1.0.0');
  assert.deepEqual(Object.keys(m.ficheros).sort(), ['a/SKILL.md', 'a/referencias/x.md', 'b/SKILL.md']);
});

test('init no pisa una skill ajena con el mismo nombre salvo --force', () => {
  const origen = paquete('v1', { 'a/SKILL.md': 'a1' });
  const dest = join(tmp, 'skills');
  mkdirSync(join(dest, 'a'), { recursive: true });
  writeFileSync(join(dest, 'a/SKILL.md'), 'mía');
  assert.equal(init({ dest, version: '1', origen }).ok, false);
  assert.equal(readFileSync(join(dest, 'a/SKILL.md'), 'utf8'), 'mía');
  assert.ok(init({ dest, version: '1', origen, force: true }).ok);
});

test('init dos veces sugiere update', () => {
  const origen = paquete('v1', { 'a/SKILL.md': 'a1' });
  const dest = join(tmp, 'skills');
  init({ dest, version: '1', origen });
  const r = init({ dest, version: '1', origen });
  assert.equal(r.ok, false);
  assert.match(r.mensaje, /npx @davidmogu\/sdd-skills update/);
});

test('update reemplaza lo no tocado, conserva lo modificado y elimina lo retirado', () => {
  const v1 = paquete('v1', { 'a/SKILL.md': 'a1', 'a/viejo.md': 'v', 'b/SKILL.md': 'b1' });
  const v2 = paquete('v2', { 'a/SKILL.md': 'a2', 'b/SKILL.md': 'b2', 'c/SKILL.md': 'c2' });
  const dest = join(tmp, 'skills');
  init({ dest, version: '1', origen: v1 });
  appendFileSync(join(dest, 'b/SKILL.md'), ' editado por el usuario');

  const r = update({ dest, version: '2', origen: v2 });
  assert.ok(r.ok);
  assert.equal(readFileSync(join(dest, 'a/SKILL.md'), 'utf8'), 'a2');            // actualizado
  assert.equal(readFileSync(join(dest, 'b/SKILL.md'), 'utf8'), 'b1 editado por el usuario'); // conservado
  assert.equal(readFileSync(join(dest, 'b/SKILL.md.nuevo'), 'utf8'), 'b2');       // versión nueva al lado
  assert.equal(readFileSync(join(dest, 'c/SKILL.md'), 'utf8'), 'c2');            // nuevo
  assert.equal(existsSync(join(dest, 'a/viejo.md')), false);                     // eliminado
  assert.deepEqual(r.conservados, ['b/SKILL.md']);

  // El fichero modificado sigue detectándose como modificado en el siguiente update
  const r2 = update({ dest, version: '2', origen: v2 });
  assert.deepEqual(r2.conservados, ['b/SKILL.md']);
});

test('el paquete real incluye las 6 skills', () => {
  const { skills } = ficherosPaquete();
  assert.deepEqual(skills.sort(), ['desarrolla', 'documenta', 'inicializa', 'planifica', 'prueba', 'revisa']);
});

test('fusionar: mapas en profundidad, listas reemplazadas, null anula, con origen', () => {
  const { valor, origen } = fusionar([
    { nombre: 'paquete', cfg: { git: { remoto: 'origin', ramas: { preset: 'github-flow', tipos: ['feature', 'bugfix'] } }, e2e: { url_base: 'x' } } },
    { nombre: 'global', cfg: { git: { ramas: { preset: 'gitflow', tipos: ['feature'] } } } },
    { nombre: 'repo', cfg: { git: { remoto: 'upstream' }, e2e: null } },
  ]);
  assert.deepEqual(valor, { git: { remoto: 'upstream', ramas: { preset: 'gitflow', tipos: ['feature'] } }, e2e: null });
  assert.equal(origen['git.remoto'], 'repo');
  assert.equal(origen['git.ramas.preset'], 'global');
  assert.equal(origen['git.ramas.tipos'], 'global');
  assert.equal(origen.e2e, 'repo');
  assert.equal(origen['e2e.url_base'], undefined);
});

test('la global no puede fijar claves solo de repo', () => {
  const [limpia, ignoradas] = quitarClavesSoloRepo({ version: 1, git: { hosting: 'github', ramas: { preset: 'trunk' } }, comandos: { lint: 'x' } });
  assert.deepEqual(limpia, { version: 1, git: { ramas: { preset: 'trunk' } } });
  assert.deepEqual(ignoradas.sort(), ['comandos', 'git.hosting']);
});

test('configEfectiva: repo > global > paquete', () => {
  mkdirSync(join(process.env.HOME, '.sdd'), { recursive: true });
  writeFileSync(join(process.env.HOME, '.sdd/config.yml'), 'version: 1\ngit:\n  ramas:\n    preset: gitflow\n  hosting: gitlab\n');
  const repo = join(tmp, 'repo');
  mkdirSync(join(repo, '.sdd'), { recursive: true });
  writeFileSync(join(repo, '.sdd/config.yml'), 'version: 1\ngit:\n  hosting: github\n');
  const { valor, origen, ignoradas } = configEfectiva(repo);
  assert.equal(valor.git.ramas.preset, 'gitflow');
  assert.equal(origen['git.ramas.preset'], 'global');
  assert.equal(valor.git.hosting, 'github');
  assert.equal(valor.git.remoto, 'origin');
  assert.equal(origen['git.remoto'], 'paquete');
  assert.deepEqual(ignoradas, ['git.hosting']);
});

test('SDD_HOME cambia la ruta de la config global', () => {
  process.env.SDD_HOME = join(tmp, 'otra');
  mkdirSync(process.env.SDD_HOME, { recursive: true });
  writeFileSync(join(process.env.SDD_HOME, 'config.yml'), 'version: 1\nidioma: en\n');
  assert.equal(configEfectiva(null).valor.idioma, 'en');
});

test('compararVersiones', () => {
  assert.equal(compararVersiones('2.96.0', '2.96'), 0);
  assert.equal(compararVersiones('2.100.1', '2.96.0'), 1);
  assert.equal(compararVersiones('2.9', '2.96.0'), -1);
});

test('CLI de punta a punta: init, doctor y update en un repo temporal', () => {
  const repo = join(tmp, 'repo');
  mkdirSync(repo);
  execFileSync('git', ['init', '-q'], { cwd: repo });
  const cli = new URL('../cli/index.mjs', import.meta.url).pathname;
  const env = { ...process.env, PATH: process.env.PATH };
  const run = (...a) => execFileSync('node', [cli, ...a], { cwd: repo, env, encoding: 'utf8' });

  assert.match(run('init'), /Instaladas 6 skills/);
  assert.ok(existsSync(join(repo, '.claude/skills/inicializa/SKILL.md')));
  assert.ok(existsSync(join(repo, '.claude/skills/inicializa/referencias/protocolo-comun.md')));

  mkdirSync(join(repo, '.sdd'));
  writeFileSync(join(repo, '.sdd/config.yml'), 'version: 1\ngit:\n  hosting: gitea\n');
  let salida;
  try { run('doctor'); } catch (e) { salida = e.stdout; }
  assert.match(salida, /✖ config repo/);                 // esquema inválido → código 1

  writeFileSync(join(repo, '.sdd/config.yml'), 'version: 1\ngit:\n  hosting: bitbucket-cloud\n');
  const d = JSON.parse(execFileSync('node', [cli, 'doctor', '--json'], { cwd: repo, env: { ...env, BITBUCKET_EMAIL: 'a', BITBUCKET_API_TOKEN: 'b' }, encoding: 'utf8' }));
  assert.equal(d.errores, 0);
  assert.equal(d.origen['git.hosting'], 'repo');
  assert.ok(!JSON.stringify(d).includes('"b"'), 'doctor no debe mostrar el valor del token');

  assert.match(run('update'), /Actualizado/);
  rmSync(tmp, { recursive: true, force: true });
});

test('detectarHosting por la URL del remoto', () => {
  assert.equal(detectarHosting('https://github.com/org/repo.git'), 'github');
  assert.equal(detectarHosting('git@github.com:org/repo.git'), 'github');
  assert.equal(detectarHosting('git@gitlab.com:grupo/sub/repo.git'), 'gitlab');
  assert.equal(detectarHosting('https://org@dev.azure.com/org/proy/_git/repo'), 'azure');
  assert.equal(detectarHosting('git@ssh.dev.azure.com:v3/org/proy/repo'), 'azure');
  assert.equal(detectarHosting('git@bitbucket.org:ws/repo.git'), 'bitbucket-cloud');
  assert.equal(detectarHosting('https://git.miempresa.com/repo.git'), null);
});
