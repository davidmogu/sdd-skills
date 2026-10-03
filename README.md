# sdd-skills

Skills de **Spec Driven Development** para Claude Code: un flujo estructurado desde la idea hasta la documentación.

```
/inicializa → /planifica → /desarrolla → /revisa → /prueba → /documenta
```

> Estado: las seis skills y el CLI están implementados; pendiente de la verificación con evals y en hostings distintos de GitHub (ver [guía del mantenedor](docs/guia-mantenedor.md#estado-de-verificación)).

📖 **[Guía de uso](docs/guia-uso.md)**

## Instalación

**Como plugin de Claude Code** (cualquier stack):

```
/plugin marketplace add davidmogu/sdd-skills
/plugin install sdd@sdd-skills
```

**Como paquete npm** (proyectos Node, desde GitHub Packages; ver la [configuración de `.npmrc`](docs/guia-uso.md#como-paquete-npm-proyectos-node)):

```bash
npm i -D @davidmogu/sdd-skills
npx sdd init
```

Las skills se invocan por su nombre (`/planifica`). Si otra skill instalada se llama igual, usa la forma con namespace del plugin (`/sdd:planifica`).

## Desarrollo

```bash
npm run build     # src/skills + src/shared → skills/ (commitea el resultado)
npm run check     # build --check + validación de frontmatter y versiones
npm test          # tests de los scripts
claude plugin validate .claude-plugin/marketplace.json
claude plugin eval . --runs 1 --ablation none --no-publish
claude --plugin-dir .   # probar el plugin en una sesión sin instalarlo
```

- Se edita en `src/`. `skills/` se genera y no se toca a mano; la CI lo comprueba.
- Cada skill declara en `shared.txt` qué ficheros de `src/shared/` necesita; el build los copia a su carpeta `referencias/`.

## Documentación

- [Requisitos](docs/requisitos.md)
- [Diseño](docs/diseno.md)
- [Plan de implementación](docs/workflow-implementacion.md)
- [Spike F0](docs/spike-f0.md)
- [Guía de uso](docs/guia-uso.md) · [Guía del mantenedor](docs/guia-mantenedor.md)

Responsable: [@davidmogu](https://github.com/davidmogu)
