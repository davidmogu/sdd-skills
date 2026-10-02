import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';

const leer = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validar = ajv.compile(JSON.parse(await leer('cli/schema/config.schema.json')));
const errores = () => ajv.errorsText(validar.errors);

for (const f of ['defaults.yml', 'config-repo.yml', 'config-global.yml']) {
  test(`src/shared/config/${f} cumple el esquema`, async () => {
    const cfg = parse(await leer(`src/shared/config/${f}`));
    assert.ok(validar(cfg), errores());
  });
}

test('config de repo con Jira completa cumple el esquema', () => {
  const cfg = {
    version: 1,
    tracker: {
      tipo: 'jira',
      jira: {
        cloudId: 'abc', sitio: 'https://miorg.atlassian.net', proyecto: 'PROJ',
        estados: { en_curso: { transicion: '21', nombre: 'In Progress' } },
        campos: { story_points: 'customfield_10016' },
      },
    },
    git: { hosting: 'azure', repo: 'org/proyecto/repo' },
  };
  assert.ok(validar(cfg), errores());
});

const invalidas = {
  'sin version': {},
  'version futura': { version: 2 },
  'hosting desconocido': { version: 1, git: { hosting: 'gitea' } },
  'ruta absoluta': { version: 1, rutas: { docs: '/etc/' } },
  'ruta que sale del repo': { version: 1, rutas: { docs: '../docs/' } },
  'clave desconocida (errata)': { version: 1, trakcer: { tipo: 'local' } },
  'patrón de rama sin {clave}': { version: 1, git: { ramas: { patron: '{tipo}/{slug}' } } },
  'puntos no Fibonacci': { version: 1, planificacion: { max_puntos: 10 } },
  'dor vacía': { version: 1, dor: [] },
};
for (const [caso, cfg] of Object.entries(invalidas)) {
  test(`el esquema rechaza: ${caso}`, () => assert.equal(validar(cfg), false));
}
