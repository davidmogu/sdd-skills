#!/usr/bin/env node
// Genera skills/ a partir de src/skills/ + src/shared/ (diseño §3, D2).
// Cada skill declara en shared.txt qué ficheros de src/shared/ necesita; se
// copian dentro de su carpeta referencias/ conservando la ruta relativa.
//
//   node scripts/build.mjs          regenera skills/
//   node scripts/build.mjs --check  falla si skills/ no coincide con el build

import { cp, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_SKILLS = join(ROOT, 'src', 'skills');
const SRC_SHARED = join(ROOT, 'src', 'shared');
const OUT = join(ROOT, 'skills');
const MANIFEST = 'shared.txt';
const AVISO = `# skills/ (generado)

No edites esta carpeta: se genera con \`npm run build\` a partir de \`src/skills/\` y \`src/shared/\`.
La CI falla si su contenido no coincide con el build.
`;

async function listFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(full)));
    else if (entry.name !== '.DS_Store') out.push(full);
  }
  return out;
}

async function readManifest(skillDir) {
  const file = join(skillDir, MANIFEST);
  if (!existsSync(file)) return [];
  return (await readFile(file, 'utf8'))
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

async function buildInto(outDir) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'README.md'), AVISO);

  const skills = (await readdir(SRC_SKILLS, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const name of skills) {
    const src = join(SRC_SKILLS, name);
    const dest = join(outDir, name);
    await cp(src, dest, {
      recursive: true,
      filter: (p) => !p.endsWith(`/${MANIFEST}`) && !p.endsWith('.DS_Store'),
    });

    for (const rel of await readManifest(src)) {
      const from = join(SRC_SHARED, rel);
      const to = join(dest, 'referencias', rel);
      if (!existsSync(from)) throw new Error(`[${name}] ${MANIFEST}: no existe src/shared/${rel}`);
      if ((await stat(from)).isDirectory()) throw new Error(`[${name}] ${MANIFEST}: ${rel} es una carpeta; lista ficheros`);
      if (existsSync(to)) throw new Error(`[${name}] colisión: referencias/${rel} ya existe en la skill`);
      await mkdir(dirname(to), { recursive: true });
      await cp(from, to);
    }
  }
  return skills;
}

async function snapshot(dir) {
  if (!existsSync(dir)) return new Map();
  const map = new Map();
  for (const f of await listFiles(dir)) map.set(relative(dir, f), await readFile(f, 'utf8'));
  return map;
}

async function check() {
  const tmp = await mkdtemp(join(tmpdir(), 'sdd-build-'));
  try {
    await buildInto(tmp);
    const [esperado, actual] = await Promise.all([snapshot(tmp), snapshot(OUT)]);
    const diffs = [];
    for (const [f, c] of esperado) {
      if (!actual.has(f)) diffs.push(`falta     skills/${f}`);
      else if (actual.get(f) !== c) diffs.push(`distinto  skills/${f}`);
    }
    for (const f of actual.keys()) if (!esperado.has(f)) diffs.push(`sobra     skills/${f}`);
    if (diffs.length) {
      console.error('skills/ no coincide con el build. Ejecuta `npm run build` y commitea:\n  ' + diffs.join('\n  '));
      process.exit(1);
    }
    console.log(`skills/ al día (${esperado.size} ficheros).`);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

try {
  if (process.argv.includes('--check')) await check();
  else {
    const skills = await buildInto(OUT);
    console.log(`Build OK: ${skills.length} skill(s) → skills/ (${skills.join(', ')})`);
  }
} catch (err) {
  console.error(`Error de build: ${err.message}`);
  process.exit(1);
}
