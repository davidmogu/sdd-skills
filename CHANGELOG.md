# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

### Añadido
- Skills `/inicializa` (repo y `--global`), `/planifica`, `/desarrolla`, `/revisa`, `/prueba` y `/documenta`.
- Configuración en dos niveles (repo > global > paquete) con JSON Schema.
- Adaptadores de tracker: local (`specs/`) y Jira (MCP de Atlassian).
- Adaptadores de hosting: GitHub (verificado), GitLab, Azure DevOps y Bitbucket Cloud (pendientes de verificar).
- CLI `sdd init | update | doctor` para el canal npm.
- `scripts/release.mjs` y workflow de publicación en GitHub Packages.
- Guías de uso y del mantenedor.
- Andamiaje del repo: manifiestos de plugin y marketplace, `package.json` para GitHub Packages.
- `scripts/build.mjs` (src → skills) con modo `--check` y `scripts/validate.mjs`.
- CI con build, validación y tests.
