---
name: revisa
description: Revisión de código asistida de un PR - comprueba criterios de aceptación, corrección, tests, seguridad, rendimiento, legibilidad y convenciones; clasifica hallazgos por severidad y publica en el PR solo los que el revisor aprueba.
argument-hint: "[número o URL del PR]"
disable-model-invocation: true
---

# /revisa

Revisión de código **consistente y trazable** a la historia. La skill propone; **el revisor decide** qué se publica y con qué veredicto.

PR: `$ARGUMENTS`. Si es una URL, extrae el número. Si está vacío, busca el PR de la rama actual (`buscarPRPorRama`); si no hay, pídelo.

## 0. Arranque

Sigue `referencias/protocolo-comun.md`. `/revisa` es de **solo lectura en el tracker**: funciona igual en `local-degradado`.

Ejecuta `comprobarAcceso()` del adaptador del hosting. Sin acceso no hay revisión: indica cómo autenticarse y detente.

## 1. Recopilar

1. `obtenerPR`, `obtenerDiff`, `estadoCI` y `listarComentarios`.
2. **Historia vinculada:** busca la clave (`[A-Z][A-Z0-9]*-[0-9]+`) en este orden: rama origen, título, commits (`git log` de la rama). Después, `obtenerHistoria`. Si no hay clave o no se encuentra, revisa sin la dimensión de criterios y anótalo como hallazgo **importante** (*"PR sin historia vinculada"*).
3. **Código en contexto:** el diff no basta. Para leer los ficheros completos sin tocar el árbol de trabajo del usuario:
   ```bash
   git fetch <remoto> <rama_origen>
   git worktree add --detach "$TMPDIR/sdd-revisa-<n>" <sha_head>
   ```
   Lee desde ahí y **elimina el worktree al terminar** (`git worktree remove --force …`), incluso si la revisión se interrumpe.
4. **Descripción del PR:** si se generó con `/desarrolla`, trae el checklist de criterios y de la DoD. **Verifica** sus afirmaciones; no las des por buenas.

## 2. Revisar

Las dimensiones y lo que se comprueba en cada una están en `referencias/checklist-revision.md`:

1. **Criterios de aceptación**: cada escenario tiene implementación **y** test.
2. **Corrección**: lógica, casos límite, errores, concurrencia.
3. **Tests**: existen, prueban el comportamiento y no son frágiles.
4. **Seguridad**.
5. **Rendimiento**.
6. **Legibilidad y mantenibilidad**.
7. **Convenciones**: rama, commits y estilo del proyecto.

**Estrategia según el tamaño** (`añadidas + eliminadas` del PR):
- Hasta `revision.umbral_subagentes` (400 por defecto) → revisa tú mismo las 7 dimensiones.
- Por encima → reparte en **subagentes en paralelo**, uno por grupo: {1, 3}, {2}, {4, 5} y {6, 7}. Lanza cada uno con un agente de propósito general cuyo prompt incluya:
  - La ruta **absoluta** de `referencias/subagente-revisor.md` y de `referencias/checklist-revision.md` (relativas a la carpeta de esta skill), con la orden de seguirlas.
  - Las dimensiones asignadas.
  - La ruta del worktree, el número de PR y la rama base.
  - La historia y sus criterios (texto).

  Cada subagente devuelve hallazgos en el formato de `subagente-revisor.md`. Al recibirlos, **verifica** cada hallazgo en el código antes de aceptarlo (descarta falsos positivos) y deduplica.

Además, tenlo en cuenta en todos los casos:
- **CI en rojo** → hallazgo bloqueante con el enlace del check fallido.
- Comentarios ya existentes en el PR: **no repitas** un hallazgo ya comentado en el mismo fichero y línea (RNF-5). Si sigue sin resolver, menciónalo en el resumen.

## 3. Clasificar y redactar

- **Severidad** según `referencias/severidades.md`: `bloqueante`, `importante`, `sugerencia` o `nit`.
- Redacta cada comentario con `plantillas/comentario.md` y el tono de `referencias/tono-comentarios.md`: qué, por qué y propuesta concreta, de forma constructiva.
- **Ubicación:** fichero y línea **de la versión nueva** dentro del diff. Si el problema está fuera del diff, va al resumen general.
- **Veredicto propuesto:**
  - Algún `bloqueante` → *pedir cambios*.
  - Algún `importante` → *pedir cambios*, salvo que el revisor decida otra cosa.
  - Solo `sugerencia` o `nit` → *aprobar*.

## 4. El revisor decide `⏸`

Muestra:
1. **Resumen:** veredicto propuesto, recuento por severidad, estado del CI y la matriz criterio → evidencia.
2. **Tabla numerada** de hallazgos: `# | severidad | fichero:línea | título`.
3. El detalle de cada comentario.

Pregunta qué publicar (*todos*, *solo bloqueantes e importantes*, *una selección por números* o *nada*) y qué **veredicto** (comentar / aprobar / pedir cambios). El revisor puede editar textos antes de publicar.

**PR propio** (autor = usuario autenticado): solo se puede *comentar*; indícalo.

## 5. Publicar

`publicarRevision` del adaptador con los comentarios seleccionados, el veredicto y el resumen (`plantillas/resumen-revision.md`). Devuelve la URL de la revisión. Si el adaptador saca comentarios del diff al resumen, indícalo.

Si el revisor elige *nada*, no publiques: el informe local queda igualmente.

## 6. Informe

Según `referencias/informe.md` (ID = clave de la historia o `PR-<n>`, fase `revisa`). En *Resultados*:
- Matriz criterio → evidencia en el código y en los tests.
- Hallazgos por severidad, todos, incluidos los no publicados (marcados).
- Estado del CI.
- Veredicto y URL de la revisión publicada.

**Siguientes pasos:**
- Si se pidieron cambios → el autor corrige y vuelve a ejecutar `/revisa <n>`.
- Si se aprobó → `/prueba <ID>` y `/documenta <ID>` si faltan; después, merge (manual).

## Referencias bajo demanda

| Cargar | Cuando |
|---|---|
| `referencias/protocolo-comun.md` | Siempre, al empezar |
| `referencias/adaptadores/git-<hosting>.md` | Pasos 0, 1 y 5 |
| `referencias/adaptadores/tracker-<modo>.md` | Paso 1.2 |
| `referencias/checklist-revision.md` | Paso 2 |
| `referencias/subagente-revisor.md` | Paso 2, si hay subagentes |
| `referencias/convenciones/ramas.md`, `referencias/convenciones/commits.md` | Dimensión 7 |
| `referencias/severidades.md`, `referencias/tono-comentarios.md`, `plantillas/*` | Paso 3 |
| `referencias/informe.md` | Paso 6 |
