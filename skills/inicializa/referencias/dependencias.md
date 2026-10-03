# Comprobación de dependencias

Genera una tabla `Dependencia | Estado | Cómo resolver`. Comprueba solo lo que aplica a la config acordada. **No instales nada** sin `⏸`, y nunca pidas tokens en el chat.

## Hosting (según `git.hosting`)

| Hosting | Comprobación | Si falta |
|---|---|---|
| github | `command -v gh` y `gh auth status` | Instalar: https://cli.github.com · login: `gh auth login` |
| gitlab | `command -v glab` y `glab auth status` | Instalar: https://gitlab.com/gitlab-org/cli · login: `glab auth login` |
| azure | `command -v az`, `az extension show --name azure-devops` y `az account show` | Instalar az: https://aka.ms/azure-cli · extensión: `az extension add --name azure-devops` · login: `az login` |
| bitbucket-cloud | `command -v curl` y que existan las variables `BITBUCKET_EMAIL` y `BITBUCKET_API_TOKEN` (comprueba **solo que existen**: `[ -n "$BITBUCKET_API_TOKEN" ]`; no muestres su valor) | Crear un API token con scopes (app Bitbucket: `read:user`, `read:repository`, `write:repository`, `read:pullrequest`, `write:pullrequest`) y exportarlo en el perfil del shell. Si el terminal de Claude no lo ve, reiniciar la sesión tras editar el perfil |

Con la CLI autenticada, comprueba además el acceso al repo mediante la operación `comprobarAcceso()` del adaptador, si existe.

## Versiones mínimas probadas

Compara con `gh --version`, `glab --version` y `az version`:

| CLI | Mínima probada |
|---|---|
| gh | 2.96 |
| glab | pendiente de probar |
| az + azure-devops | pendiente de probar |

Si la versión instalada es menor, avísalo (no bloquea).

## Pruebas e2e

| Comprobación | Si falta |
|---|---|
| `npx --no-install playwright --version` (proyectos Node) | Se ofrecerá instalarlo en `/prueba` |
| MCP de navegador: herramientas con `playwright` o `claude-in-chrome` en el nombre | Playwright MCP: `claude mcp add playwright -- npx @playwright/mcp@latest` · o la extensión Claude in Chrome |

## Atlassian

| Comprobación | Si falta |
|---|---|
| Herramientas MCP de Atlassian disponibles y `atlassianUserInfo` responde | Conectar el MCP de Atlassian en Claude Code (`/mcp`) y autenticarse |

## Git

| Comprobación | Si falta |
|---|---|
| `git config user.name` y `user.email` | `git config --global user.name "…"` |
| Árbol limpio (`git status --porcelain`) | Solo informativo en `/inicializa` |
