# Protocolo común de arranque

Todas las skills SDD ejecutan estos pasos **antes** de los suyos. Las rutas `referencias/…` son relativas a la carpeta de la skill.

## 1. Localizar el repo

```bash
git rev-parse --show-toplevel
```

- Si falla (no es un repo git): solo `/inicializa --global` puede continuar. El resto se detiene con el mensaje *"Ejecuta la skill dentro de un repositorio git."*
- A partir de aquí, `<repo>` es esa ruta.

## 2. Cargar la configuración (tres niveles)

Lee, si existen, en este orden:

| Nivel | Fichero |
|---|---|
| 3 · paquete | `referencias/config/defaults.yml` |
| 2 · global | `$SDD_HOME/config.yml` o, si `SDD_HOME` no está definida, `~/.sdd/config.yml` |
| 1 · repo | `<repo>/.sdd/config.yml` |

**Fusiona** con prioridad repo > global > paquete:
- Los mapas se fusionan clave a clave, en profundidad.
- Las listas (`dor`, `dod`, `git.ramas.tipos`…) se **reemplazan enteras**.
- Un `null` explícito en un nivel superior anula el valor inferior.
- **Ignora en la global** las claves solo de repo: `git.hosting`, `git.repo`, `comandos.*`, `e2e.url_base`, `e2e.ruta_tests`, `tracker.jira.proyecto`, `tracker.jira.estados` y `rutas.*`. Si aparece alguna, anótalo como aviso para el informe.
- Si `version` es mayor que 1, detente: *"La config requiere una versión más reciente de las skills SDD."*
- Si `dor` o `dod` no están definidas en ningún nivel, usa las de `referencias/convenciones/dor-dod.md`.

Guarda mentalmente la **config efectiva** y el **origen** de los valores relevantes; el informe los resume.

### Sin `.sdd/config.yml` en el repo

No te detengas (salvo que la skill indique lo contrario). Completa lo que dependa del repo así:
- `git.hosting` y `git.repo`: a partir de `git remote get-url <git.remoto>`, con la tabla de detección de `referencias/contratos/git-host.md`.
- `comandos.*`: si la skill necesita un comando que falta, dedúcelo del manifiesto del proyecto (scripts de `package.json`, `mvn test`, `./gradlew test`, `pytest`…) y **confírmalo con el usuario una vez**.
- Con `tracker.tipo: jira` y sin `tracker.jira.proyecto`: pregunta la clave del proyecto una vez.

Anota para el informe: *"Config del repo no encontrada: se usó la global y la detección automática. Ejecuta `/inicializa` para fijarla y compartirla con el equipo."*

## 3. Determinar el modo

| `tracker.tipo` | Condición | Modo |
|---|---|---|
| `local` | — | `local` |
| `jira` | el MCP de Atlassian responde | `jira` |
| `jira` | el MCP no está disponible o falla | `local-degradado` |

**Cómo comprobar el MCP de Atlassian:**
1. Busca herramientas cuyo nombre contenga `atlassian` y una operación de Jira (p. ej. `…getJiraIssue`). El nombre del servidor puede variar según la instalación.
2. Si las herramientas están diferidas, cárgalas con la búsqueda de herramientas.
3. Llama a `atlassianUserInfo`. Si responde, el modo es `jira`; si no existe o da error, el modo es `local-degradado`.

**En `local-degradado`:**
- Las skills que **escriben en el tracker** (`/planifica`, `/desarrolla`, y `/prueba` al crear bugs) se detienen antes de escribir. Preguntan si reconectar el MCP o continuar **sin sincronizar**; en ese caso, no crean historias locales que dupliquen las de Jira.
- Las skills de solo lectura continúan con la información disponible.
- En los dos casos, anota en el informe qué quedó sin sincronizar.

## 4. Cargar los adaptadores

Carga **solo** los que correspondan:

- Tracker: `referencias/adaptadores/tracker-local.md` (modos `local` y `local-degradado`) o `referencias/adaptadores/tracker-jira.md` (modo `jira`).
- Hosting: `referencias/adaptadores/git-<git.hosting>.md`.

Si el fichero del adaptador **no existe** (hosting aún no soportado), avisa al usuario. Continúa sin las operaciones de hosting (sin crear PR ni comentar) e indícalo en el informe.

Los contratos (`referencias/contratos/*.md`) definen qué devuelve cada operación. Consúltalos solo si hay dudas sobre la forma de los datos.

## 5. Resolver plantillas

Para cada plantilla `<x>.md` que use la skill, la primera que exista es la buena:

1. `<repo>/<rutas.plantillas>/<x>.md` (por defecto `.sdd/templates/`)
2. `$SDD_HOME/templates/<x>.md` o `~/.sdd/templates/<x>.md`
3. `plantillas/<x>.md` de la skill

## 6. Reglas durante toda la ejecución

- **Confirmaciones `⏸`:** antes de cualquier efecto externo o difícil de deshacer, muestra qué vas a hacer y espera un sí explícito. Usa la herramienta de preguntas al usuario si está disponible. Esto aplica a crear o editar issues, transicionar estados, hacer push, crear PRs, publicar comentarios, escribir en Confluence y modificar `.gitignore` o la config. Una aprobación vale solo para la acción mostrada.
- **Nunca** escribas secretos (tokens, contraseñas, cabeceras de autenticación) en ficheros, informes, commits ni comentarios.
- **Idempotencia:** antes de crear algo externo (issue, comentario, página), busca si ya existe y actualízalo en lugar de duplicarlo.
- **Idioma:** usa el de `idioma` (por defecto español) para **todo**: los mensajes y preguntas al usuario, el resumen final, las historias, los commits, los informes y los comentarios. Aunque el resto de la sesión o las instrucciones del sistema estén en otro idioma, mientras ejecutas la skill responde en el de la config.
- **No inventes datos:** si falta información (ID inexistente, criterio ambiguo, comando desconocido), pregunta o detente. No supongas.
- **Siguiente paso:** las skills no se invocan entre sí. Sugiere al usuario el siguiente comando (p. ej. *"Siguiente paso: `/revisa 45`"*).

## 7. Al terminar

Genera el informe según `referencias/informe.md`, incluso si la skill se detuvo antes de completarse (con `resultado: bloqueado` y el motivo).
