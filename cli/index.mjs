#!/usr/bin/env node
// CLI del canal npm (diseño §4): sdd init · update · doctor

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { destino, init, update } from './lib/instalar.mjs';
import { doctor } from './lib/doctor.mjs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2);
const orden = args.find((a) => !a.startsWith('-'));
const flag = (f) => args.includes(f);

const AYUDA = `sdd ${version} — Skills de Spec Driven Development para Claude Code

Uso (con el nombre completo del paquete: \`npx sdd\` podría ejecutar otro paquete público):
  npx @davidmogu/sdd-skills init [--global] [--force]   Copia las skills a .claude/skills/ (o a ~/.claude/skills/)
  npx @davidmogu/sdd-skills update [--global]           Actualiza sin pisar los ficheros que hayas modificado
  npx @davidmogu/sdd-skills doctor [--json]             Valida configs, instalación y dependencias

Después, en Claude Code: /inicializa`;

function raizRepo() {
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
}

function main() {
  if (flag('--version') || flag('-v')) return console.log(version);
  if (!orden || flag('--help') || flag('-h')) return console.log(AYUDA);

  const global = flag('--global');
  const repo = raizRepo();

  if (orden === 'init' || orden === 'update') {
    if (!global && !repo) {
      console.error('No estás en un repositorio git. Usa --global para instalar en ~/.claude/skills/.');
      return 1;
    }
    const dest = destino({ global, cwd: repo });
    const r = orden === 'init' ? init({ dest, version, force: flag('--force') }) : update({ dest, version });
    if (!r.ok) { console.error(r.mensaje); return 1; }
    if (orden === 'init') {
      console.log(r.mensaje);
      console.log(global ? 'Siguiente paso: /inicializa --global y después /inicializa en cada repo.' : 'Siguiente paso: haz commit de .claude/skills/ y ejecuta /inicializa en Claude Code.');
    } else {
      console.log(`Actualizado ${r.version.de} → ${r.version.a} en ${dest}`);
      for (const [k, v] of Object.entries({ nuevos: r.nuevos, actualizados: r.actualizados, eliminados: r.eliminados })) if (v.length) console.log(`  ${k}: ${v.length}`);
      if (r.conservados.length) {
        console.log(`  conservados (modificados por ti, no se tocan): ${r.conservados.length}`);
        for (const f of r.conservados) console.log(`    ${f}  → compara con ${f}.nuevo si existe`);
        console.log('  Consejo: personaliza en .sdd/templates/ o ~/.sdd/templates/ en lugar de editar las skills.');
      }
    }
    return 0;
  }

  if (orden === 'doctor') {
    const r = doctor({ repo });
    if (flag('--json')) { console.log(JSON.stringify(r, null, 2)); return r.errores ? 1 : 0; }
    console.log('Comprobaciones');
    for (const f of r.filas) console.log(`  ${f.estado} ${f.que.padEnd(16)} ${f.detalle}`);
    console.log('\nConfig efectiva (origen)');
    for (const [k, o] of Object.entries(r.origen).sort()) {
      const v = k.split('.').reduce((n, p) => n?.[p], r.efectiva);
      const texto = Array.isArray(v) ? `[${v.length} elementos]` : JSON.stringify(v);
      console.log(`  ${k.padEnd(34)} ${String(texto).slice(0, 50).padEnd(52)} ${o}`);
    }
    return r.errores ? 1 : 0;
  }

  console.error(`Orden desconocida: ${orden}\n\n${AYUDA}`);
  return 1;
}

process.exitCode = main() ?? 0;
