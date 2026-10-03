// sdd doctor: valida las configs, muestra la config efectiva con su origen y
// comprueba instalaciones duplicadas, CLIs del hosting y versiones mínimas (D11).

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { configEfectiva, rutaGlobal, rutaRepo, validar } from './config.mjs';
import { MANIFIESTO } from './instalar.mjs';

const VERSIONES = JSON.parse(readFileSync(new URL('../versiones-minimas.json', import.meta.url), 'utf8'));
const CLI_POR_HOSTING = { github: 'gh', gitlab: 'glab', azure: 'az' };

const ejecutar = (cmd, args) => {
  try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
};

export function compararVersiones(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return Math.sign(d);
  }
  return 0;
}

export function detectarHosting(url) {
  if (!url) return null;
  if (/github\.com[:/]/.test(url)) return 'github';
  if (/dev\.azure\.com|visualstudio\.com/.test(url)) return 'azure';
  if (/bitbucket\.org[:/]/.test(url)) return 'bitbucket-cloud';
  if (/gitlab/.test(url)) return 'gitlab';
  return null;
}

export function versionDe(cli) {
  const salida = cli === 'az' ? ejecutar('az', ['version', '-o', 'tsv']) : ejecutar(cli, ['--version']);
  return salida?.match(/(\d+\.\d+(?:\.\d+)?)/)?.[1] ?? null;
}

function instalaciones(repo) {
  const home = process.env.HOME || homedir();
  const res = [];
  for (const [donde, dir] of [['npm global', join(home, '.claude', 'skills')], ['npm repo', repo && join(repo, '.claude', 'skills')]]) {
    if (dir && existsSync(join(dir, MANIFIESTO))) {
      res.push(`${donde} (${JSON.parse(readFileSync(join(dir, MANIFIESTO), 'utf8')).version})`);
    }
  }
  const settings = repo && join(repo, '.claude', 'settings.json');
  if (settings && existsSync(settings) && /"sdd@[^"]+"\s*:\s*true/.test(readFileSync(settings, 'utf8'))) res.push('plugin repo');
  const lista = ejecutar('claude', ['plugin', 'list']);
  if (lista && /\bsdd@/.test(lista)) res.push('plugin');
  return res;
}

export function doctor({ repo }) {
  const filas = [];
  const add = (estado, que, detalle = '') => filas.push({ estado, que, detalle });

  // Configs
  const { valor, origen, global, delRepo, ignoradas } = configEfectiva(repo);
  for (const [nivel, ruta, cfg] of [['global', rutaGlobal(), global], ['repo', repo && rutaRepo(repo), delRepo]]) {
    if (!ruta) continue;
    if (cfg === undefined) { add(nivel === 'repo' ? '⚠' : '·', `config ${nivel}`, `no existe (${ruta})${nivel === 'repo' ? ' — ejecuta /inicializa' : ''}`); continue; }
    const errores = validar(cfg);
    if (errores.length) add('✖', `config ${nivel}`, `${ruta}: ${errores.join('; ')}`);
    else add('✔', `config ${nivel}`, ruta);
  }
  if (ignoradas.length) add('⚠', 'config global', `claves solo de repo ignoradas: ${ignoradas.join(', ')}`);

  // Instalaciones
  const inst = instalaciones(repo);
  if (inst.length === 0) add('⚠', 'instalación', 'no se detecta ninguna (plugin o npm)');
  else if (inst.length > 1) add('⚠', 'instalación', `duplicada: ${inst.join(', ')} — los nombres de las skills chocarán; deja solo una`);
  else add('✔', 'instalación', inst[0]);

  // Hosting (de la config o, si falta, detectado por la URL del remoto, como hacen las skills)
  let hosting = valor.git?.hosting;
  if (!hosting && repo) {
    hosting = detectarHosting(ejecutar('git', ['-C', repo, 'remote', 'get-url', valor.git?.remoto ?? 'origin']));
    if (hosting) add('·', 'hosting', `${hosting} (detectado por el remoto; fíjalo con /inicializa)`);
  }
  const cli = CLI_POR_HOSTING[hosting];
  if (cli) {
    const v = versionDe(cli);
    const min = VERSIONES[cli];
    if (!v) add('✖', cli, 'no instalada');
    else if (min && compararVersiones(v, min) < 0) add('⚠', cli, `${v} < mínima probada ${min}`);
    else add('✔', cli, `${v}${min ? '' : ' (sin versión mínima probada aún)'}`);
  } else if (hosting === 'bitbucket-cloud') {
    const faltan = ['BITBUCKET_EMAIL', 'BITBUCKET_API_TOKEN'].filter((k) => !process.env[k]);
    add(faltan.length ? '✖' : '✔', 'bitbucket', faltan.length ? `faltan variables: ${faltan.join(', ')}` : 'variables definidas');
  } else {
    add('·', 'hosting', 'sin definir');
  }

  // Git
  if (repo) {
    const nombre = ejecutar('git', ['-C', repo, 'config', 'user.name']);
    add(nombre ? '✔' : '⚠', 'git user.name', nombre ?? 'sin configurar');
  }

  const errores = filas.filter((f) => f.estado === '✖').length;
  return { filas, efectiva: valor, origen, errores };
}
