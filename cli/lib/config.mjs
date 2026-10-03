// Carga, fusión y validación de la configuración SDD en tres niveles
// (repo > global > paquete), con las mismas reglas que referencias/protocolo-comun.md.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { parse } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const RAIZ_PAQUETE = new URL('../../', import.meta.url);

export const CLAVES_SOLO_REPO = [
  'git.hosting', 'git.repo', 'comandos', 'e2e.url_base', 'e2e.ruta_tests',
  'tracker.jira.proyecto', 'tracker.jira.estados', 'rutas',
];

export const sddHome = () => process.env.SDD_HOME || join(process.env.HOME || homedir(), '.sdd');
export const rutaGlobal = () => join(sddHome(), 'config.yml');
export const rutaRepo = (repo) => join(repo, '.sdd', 'config.yml');

export function leerYaml(ruta) {
  if (!existsSync(ruta)) return undefined;
  return parse(readFileSync(ruta, 'utf8')) ?? {};
}

export function defaultsPaquete() {
  return leerYaml(new URL('src/shared/config/defaults.yml', RAIZ_PAQUETE).pathname)
    ?? leerYaml(new URL('skills/inicializa/referencias/config/defaults.yml', RAIZ_PAQUETE).pathname)
    ?? {};
}

let validador;
export function validar(cfg) {
  if (!validador) {
    const ajv = new Ajv2020({ allErrors: true });
    addFormats(ajv);
    validador = ajv.compile(JSON.parse(readFileSync(new URL('cli/schema/config.schema.json', RAIZ_PAQUETE), 'utf8')));
  }
  const ok = validador(cfg);
  return ok ? [] : validador.errors.map((e) => `${e.instancePath || '/'} ${e.message}`);
}

const esMapa = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Elimina de una config global las claves solo de repo; devuelve [limpia, ignoradas]. */
export function quitarClavesSoloRepo(cfg) {
  const copia = structuredClone(cfg ?? {});
  const ignoradas = [];
  for (const ruta of CLAVES_SOLO_REPO) {
    const partes = ruta.split('.');
    let nodo = copia;
    for (const p of partes.slice(0, -1)) nodo = esMapa(nodo?.[p]) ? nodo[p] : undefined;
    const ultima = partes.at(-1);
    if (nodo && ultima in nodo) { delete nodo[ultima]; ignoradas.push(ruta); }
  }
  return [copia, ignoradas];
}

/**
 * Fusiona niveles de menor a mayor prioridad. Mapas: en profundidad; listas: se
 * reemplazan; null explícito anula. Devuelve { valor, origen } con el nivel de cada hoja.
 */
export function fusionar(niveles) {
  const valor = {};
  const origen = {};
  const aplicar = (dest, src, nombre, prefijo) => {
    for (const [k, v] of Object.entries(src)) {
      const ruta = prefijo ? `${prefijo}.${k}` : k;
      if (esMapa(v)) {
        if (!esMapa(dest[k])) dest[k] = {};
        aplicar(dest[k], v, nombre, ruta);
      } else {
        dest[k] = structuredClone(v);
        for (const r of Object.keys(origen)) if (r.startsWith(`${ruta}.`)) delete origen[r];
        origen[ruta] = nombre;
      }
    }
  };
  for (const { nombre, cfg } of niveles) if (cfg) aplicar(valor, cfg, nombre, '');
  return { valor, origen };
}

/** Config efectiva de un repo (o solo global si repo es null). */
export function configEfectiva(repo) {
  const global = leerYaml(rutaGlobal());
  const [globalLimpia, ignoradas] = quitarClavesSoloRepo(global);
  const delRepo = repo ? leerYaml(rutaRepo(repo)) : undefined;
  const { valor, origen } = fusionar([
    { nombre: 'paquete', cfg: defaultsPaquete() },
    { nombre: 'global', cfg: global ? globalLimpia : undefined },
    { nombre: 'repo', cfg: delRepo },
  ]);
  return { valor, origen, global, delRepo, ignoradas };
}
