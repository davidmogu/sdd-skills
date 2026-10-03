// sdd init / sdd update: copia las skills a .claude/skills (repo) o ~/.claude/skills (global)
// con un manifiesto de hashes para no pisar ficheros modificados por el usuario (RNF-3).

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { homedir } from 'node:os';

export const MANIFIESTO = '.sdd-manifest.json';
const ORIGEN = new URL('../../skills/', import.meta.url).pathname;

const hash = (ruta) => createHash('sha256').update(readFileSync(ruta)).digest('hex');

function listar(dir, base = dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...listar(full, base));
    else if (e.name !== '.DS_Store') out.push(relative(base, full));
  }
  return out;
}

/** Ficheros de las skills del paquete: { 'inicializa/SKILL.md': sha256 } */
export function ficherosPaquete(origen = ORIGEN) {
  const skills = readdirSync(origen, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  const mapa = {};
  for (const s of skills) for (const f of listar(join(origen, s))) mapa[join(s, f)] = hash(join(origen, s, f));
  return { skills, mapa };
}

export function destino({ global, cwd }) {
  return global ? join(process.env.HOME || homedir(), '.claude', 'skills') : join(cwd, '.claude', 'skills');
}

export function leerManifiesto(dest) {
  const ruta = join(dest, MANIFIESTO);
  return existsSync(ruta) ? JSON.parse(readFileSync(ruta, 'utf8')) : null;
}

function escribirManifiesto(dest, version, ficheros) {
  writeFileSync(join(dest, MANIFIESTO), `${JSON.stringify({ version, ficheros }, null, 2)}\n`);
}

export function init({ dest, version, force = false, origen = ORIGEN }) {
  if (leerManifiesto(dest)) {
    return { ok: false, mensaje: `Ya instalado en ${dest}. Usa \`sdd update\`${dest.includes('.claude') ? '' : ''}.` };
  }
  const { skills, mapa } = ficherosPaquete(origen);
  const conflictos = skills.filter((s) => existsSync(join(dest, s)));
  if (conflictos.length && !force) {
    return { ok: false, mensaje: `Ya existen skills con el mismo nombre en ${dest}: ${conflictos.join(', ')}. Usa --force para sobrescribirlas.` };
  }
  mkdirSync(dest, { recursive: true });
  for (const s of skills) {
    rmSync(join(dest, s), { recursive: true, force: true });
    cpSync(join(origen, s), join(dest, s), { recursive: true });
  }
  escribirManifiesto(dest, version, mapa);
  return { ok: true, mensaje: `Instaladas ${skills.length} skills en ${dest}: ${skills.map((s) => `/${s}`).join(' ')}` };
}

export function update({ dest, version, origen = ORIGEN }) {
  const manifiesto = leerManifiesto(dest);
  if (!manifiesto) return { ok: false, mensaje: `No hay instalación en ${dest}. Usa \`sdd init\`.` };
  const { mapa } = ficherosPaquete(origen);
  const anterior = manifiesto.ficheros;
  const nuevoManifiesto = {};
  const res = { actualizados: [], nuevos: [], conservados: [], eliminados: [] };

  for (const [f, h] of Object.entries(mapa)) {
    const ruta = join(dest, f);
    const modificado = existsSync(ruta) && anterior[f] && hash(ruta) !== anterior[f];
    if (modificado) {
      // El usuario lo cambió: no se pisa. Se deja la versión nueva al lado para comparar.
      if (h !== anterior[f]) writeFileSync(`${ruta}.nuevo`, readFileSync(join(origen, f)));
      res.conservados.push(f);
      nuevoManifiesto[f] = anterior[f];
      continue;
    }
    if (!existsSync(ruta)) res.nuevos.push(f);
    else if (hash(ruta) !== h) res.actualizados.push(f);
    mkdirSync(dirname(ruta), { recursive: true });
    cpSync(join(origen, f), ruta);
    nuevoManifiesto[f] = h;
  }

  for (const [f, h] of Object.entries(anterior)) {
    if (f in mapa) continue;
    const ruta = join(dest, f);
    if (existsSync(ruta) && hash(ruta) === h) { rmSync(ruta); res.eliminados.push(f); }
    else if (existsSync(ruta)) res.conservados.push(f);
  }
  // Carpetas vacías tras eliminar
  for (const s of readdirSync(dest, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const dir = join(dest, s.name);
    if (statSync(dir).isDirectory() && listar(dir).length === 0 && Object.keys(anterior).some((f) => f.startsWith(`${s.name}/`))) {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  escribirManifiesto(dest, version, nuevoManifiesto);
  return { ok: true, version: { de: manifiesto.version, a: version }, ...res };
}
