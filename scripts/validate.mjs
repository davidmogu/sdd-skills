#!/usr/bin/env node
// Validaciones estáticas del paquete (diseño §10):
//  - frontmatter de cada src/skills/*/SKILL.md (name = carpeta, description,
//    disable-model-invocation: true por D3) y tamaño máximo (RNF-7)
//  - versiones sincronizadas entre package.json, plugin.json y marketplace.json

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_LINEAS = 300;
const errores = [];
const avisos = [];

export function parseFrontmatter(texto) {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const datos = {};
  for (const linea of m[1].split('\n')) {
    const kv = linea.match(/^([\w-]+):\s*(.*)$/);
    if (kv) datos[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return datos;
}

async function validarSkills() {
  const dir = join(ROOT, 'src', 'skills');
  const skills = (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  for (const name of skills) {
    const file = join(dir, name, 'SKILL.md');
    if (!existsSync(file)) { errores.push(`[${name}] falta SKILL.md`); continue; }
    const texto = await readFile(file, 'utf8');
    const fm = parseFrontmatter(texto);
    if (!fm) { errores.push(`[${name}] SKILL.md sin frontmatter`); continue; }
    if (fm.name !== name) errores.push(`[${name}] name "${fm.name}" no coincide con la carpeta`);
    if (!fm.description) errores.push(`[${name}] falta description`);
    if (fm['disable-model-invocation'] !== 'true') errores.push(`[${name}] falta disable-model-invocation: true (D3)`);
    const lineas = texto.split('\n').length;
    if (lineas > MAX_LINEAS) avisos.push(`[${name}] SKILL.md tiene ${lineas} líneas (> ${MAX_LINEAS}); mueve detalle a referencias/`);
  }
  return skills.length;
}

async function validarVersiones() {
  const leer = async (p) => JSON.parse(await readFile(join(ROOT, p), 'utf8'));
  const pkg = await leer('package.json');
  const plugin = await leer('.claude-plugin/plugin.json');
  const market = await leer('.claude-plugin/marketplace.json');
  const entrada = market.plugins.find((p) => p.name === plugin.name);
  if (!entrada) errores.push(`marketplace.json no contiene el plugin "${plugin.name}"`);
  const versiones = { 'package.json': pkg.version, 'plugin.json': plugin.version, 'marketplace.json': entrada?.version };
  if (new Set(Object.values(versiones)).size !== 1) {
    errores.push(`versiones desincronizadas: ${JSON.stringify(versiones)}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const n = await validarSkills();
  await validarVersiones();
  for (const a of avisos) console.warn(`aviso: ${a}`);
  if (errores.length) {
    console.error(errores.map((e) => `error: ${e}`).join('\n'));
    process.exit(1);
  }
  console.log(`Validación OK: ${n} skill(s), versiones sincronizadas.`);
}
