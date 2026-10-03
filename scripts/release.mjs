#!/usr/bin/env node
// Prepara una versión (diseño §10): sincroniza la versión en package.json, plugin.json y
// marketplace.json, cierra la sección [Sin publicar] del CHANGELOG, hace commit y crea el tag.
// No hace push: lo hace el responsable del paquete (git push && git push --tags).
//
//   node scripts/release.mjs 0.1.0 [--dry-run]

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

export function aplicarVersion(raiz, version, fecha) {
  if (!SEMVER.test(version)) throw new Error(`Versión no válida: ${version}`);
  const json = (p, mod) => {
    const ruta = join(raiz, p);
    const d = JSON.parse(readFileSync(ruta, 'utf8'));
    mod(d);
    writeFileSync(ruta, `${JSON.stringify(d, null, 2)}\n`);
  };
  json('package.json', (d) => { d.version = version; });
  json('.claude-plugin/plugin.json', (d) => { d.version = version; });
  json('.claude-plugin/marketplace.json', (d) => { for (const p of d.plugins) if (p.name === 'sdd') p.version = version; });

  const ruta = join(raiz, 'CHANGELOG.md');
  const cl = readFileSync(ruta, 'utf8');
  if (!cl.includes('## [Sin publicar]')) throw new Error('CHANGELOG.md no tiene sección [Sin publicar]');
  const seccion = cl.split('## [Sin publicar]')[1].split(/\n## \[/)[0];
  if (!/^- /m.test(seccion)) throw new Error('La sección [Sin publicar] del CHANGELOG está vacía');
  writeFileSync(ruta, cl.replace('## [Sin publicar]', `## [Sin publicar]\n\n## [${version}] - ${fecha}`));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
  const version = process.argv[2];
  const seco = process.argv.includes('--dry-run');
  const git = (...a) => execFileSync('git', a, { cwd: raiz, encoding: 'utf8' }).trim();
  try {
    if (!version) throw new Error('Uso: node scripts/release.mjs <versión> [--dry-run]');
    if (git('status', '--porcelain')) throw new Error('El árbol de trabajo no está limpio');
    if (git('rev-parse', '--abbrev-ref', 'HEAD') !== 'main') throw new Error('Las versiones se publican desde main');
    if (git('tag', '--list', `v${version}`)) throw new Error(`El tag v${version} ya existe`);
    execFileSync('npm', ['run', '-s', 'check'], { cwd: raiz, stdio: 'inherit' });
    execFileSync('npm', ['test', '--silent'], { cwd: raiz, stdio: 'inherit' });
    if (seco) { console.log(`[dry-run] Se publicaría v${version}`); process.exit(0); }
    aplicarVersion(raiz, version, new Date().toISOString().slice(0, 10));
    execFileSync('npm', ['install', '--package-lock-only', '--silent'], { cwd: raiz, stdio: 'inherit' });
    git('add', 'package.json', 'package-lock.json', '.claude-plugin', 'CHANGELOG.md');
    git('commit', '-m', `chore(release): v${version}`);
    git('tag', '-a', `v${version}`, '-m', `v${version}`);
    console.log(`Listo: commit y tag v${version}. Publica con: git push && git push origin v${version}`);
  } catch (e) {
    console.error(`release: ${e.message}`);
    process.exit(1);
  }
}
