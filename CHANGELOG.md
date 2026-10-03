# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

## [0.1.1] - 2026-10-03

### Corregido
- Documentación y mensajes del CLI usan `npx @davidmogu/sdd-skills …`: con `npx sdd …`, si la instalación falla, npx ejecuta otro paquete público llamado `sdd`.
- `scripts/release.mjs` actualiza también la versión de `package-lock.json`.

## [0.1.0] - 2026-10-03

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
