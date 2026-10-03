# Guía del mantenedor

Responsable del paquete: **@davidmogu** (único que aprueba cambios en convenciones y plantillas, y que publica versiones).

## Estructura

```
src/skills/<skill>/   SKILL.md, referencias/, plantillas/, shared.txt   ← se edita aquí
src/shared/           protocolo, informe, convenciones, contratos, adaptadores, config
skills/               GENERADO por `npm run build` (commiteado: el plugin se instala desde git)
cli/                  sdd init · update · doctor, esquema de config, versiones mínimas
scripts/              build, validate, release
tests/                node:test (esquema, convenciones, adaptadores, CLI, release)
evals/                casos de `claude plugin eval`
```

**Nunca edites `skills/` a mano.** La CI falla si no coincide con el build.

## Ciclo de cambio

```bash
# editar src/…
npm run build         # regenera skills/
npm run check         # build --check + frontmatter + versiones
npm test
claude --plugin-dir . # probar en una sesión sin instalar
```

Antes de cada versión, ejecuta las evals (sección siguiente).

## Evals

```bash
claude plugin eval . --scaffold --allow-tools Bash Write Edit --runs 1 --ablation none --no-publish --max-cost-usd 8
claude plugin eval . --scaffold --allow-tools Bash Write Edit --case 'planifica-*' --runs 3 --ablation none --no-publish
```

Casos, diseño y coste estimado: [`evals/README.md`](../evals/README.md).

- **Cuestan dinero o cuota:** cada caso lanza sesiones de Claude. Usa `--max-cost-usd` y limita con `--case` o `--tag`.
- `--scaffold` hace falta en los casos que preparan un repo de ejemplo (scripts propios, revisados).
- Las evals por hosting (D11) necesitan los repos sandbox y sus credenciales.

## Añadir un adaptador de hosting

1. `src/shared/adaptadores/git-<hosting>.md` con **todas** las operaciones de `contratos/git-host.md`. El test `tests/adaptadores.test.mjs` lo comprueba, y también que los filtros `jq` compilen.
2. Patrón de detección en `contratos/git-host.md`, en el `enum` de `git.hosting` del esquema y en `detectarHosting` (`cli/lib/doctor.mjs`).
3. Añádelo al `shared.txt` de `desarrolla`, `revisa` y `documenta`.
4. Pruébalo contra un repo real y registra la versión de la CLI en `cli/versiones-minimas.json` y en `inicializa/referencias/dependencias.md`.

## Añadir una skill

1. `src/skills/<nombre>/SKILL.md` con frontmatter `name` (= carpeta), `description`, `argument-hint` y `disable-model-invocation: true` (D3).
2. Empieza con *Arranque: sigue `referencias/protocolo-comun.md`* y termina con el informe.
3. `shared.txt` con lo que necesite de `src/shared/`.
4. Menos de 300 líneas en `SKILL.md`; el detalle va en `referencias/`.
5. Actualiza el test *"el paquete real incluye las N skills"* y la guía de uso.

## Publicar una versión

```bash
# 1. CHANGELOG.md: describe los cambios en [Sin publicar]
node scripts/release.mjs 0.2.0 --dry-run    # comprueba sin tocar nada
node scripts/release.mjs 0.2.0              # versión en los 3 manifiestos + CHANGELOG + commit + tag
git push && git push origin v0.2.0          # el workflow Release publica en GitHub Packages y crea la release
```

**SemVer:**
- **Mayor:** cambios incompatibles en la config (`version` del esquema), renombrar skills o cambiar contratos.
- **Menor:** skills, adaptadores u opciones nuevas.
- **Parche:** correcciones.

### Protección (configurar una vez en GitHub)

- **Rama `main`:** exigir PR y CI en verde.
- **Tags `v*`:** solo el responsable puede crearlos (Settings → Rules → Rulesets → Tag rules).

## Estado de verificación

| Pieza | Verificado contra un sistema real |
|---|---|
| Adaptador GitHub | ✅ 2026-10-02 (`davidmogu/sdd-sandbox`) |
| Adaptadores GitLab, Azure y Bitbucket Cloud | ⏳ Pendiente: faltan sandboxes y credenciales |
| Adaptador Jira y `/inicializa` con Atlassian | ✅ 2026-10-03: las 8 operaciones del contrato y `/inicializa`, `/planifica` y `/desarrolla` de punta a punta contra el proyecto `SDD` ([`evals/RESULTADOS.md`](../evals/RESULTADOS.md)) |
| Confluence (`/documenta`) | ⏳ Pendiente: falta un espacio de pruebas |
| Skills de punta a punta | ✅ 14/14 evals en modo local + GitHub (2026-10-03, [`evals/RESULTADOS.md`](../evals/RESULTADOS.md)); falta `/revisa` sobre un PR real y `/prueba` con navegador |
| CLI npm | ✅ Tests automáticos + instalación real de la 0.1.1 desde GitHub Packages (2026-10-03) |
