---
name: documenta
description: Crea o actualiza la documentación afectada por una historia (README, API, ADR, guías, changelog) en docs/, detecta documentación obsoleta y, si está configurado, la publica en Confluence vinculada a la historia.
argument-hint: "[ID de la historia]"
disable-model-invocation: true
---

# /documenta

Mantiene la documentación al día con el código: parte de **lo que cambió** en la historia y actualiza solo lo que corresponde. El control de versiones lo da git; Confluence, si está configurado, es una copia publicada.

Historia: `$ARGUMENTS`. Si está vacío, intenta deducirla de la rama actual; si no, pídela.

## 0. Arranque

Sigue `referencias/protocolo-comun.md`. En `local-degradado`, la documentación en `docs/` se hace igual. La vinculación en Jira y la publicación en Confluence quedan en *Sin sincronizar*.

## 1. Qué cambió

1. `obtenerHistoria(<ID>)`: enunciado, criterios y notas, para entender el **para qué**.
2. **Diff de la historia**, en este orden de preferencia:
   - Rama sin fusionar `*/<ID>-*` → `git diff <remoto>/<base>...<rama>`.
   - PR fusionado → `buscarPRPorRama` y después `obtenerDiff` (adaptador del hosting).
   - Si no, los commits con la clave en el scope: `git log --grep="(<ID>)" --format=%H <remoto>/<base>`. Su diff combinado es el cambio de la historia.

   Si no hay ningún cambio de código, pregunta si se quiere documentar igualmente a partir de la historia (p. ej. documentación funcional previa).
3. **Plan técnico** (`<rutas.specs_locales>/<ID>/plan.md`), si existe: sus *Decisiones* son candidatas a ADR.

## 2. Qué documentar

Con `referencias/mapa-documental.md`, cruza cada tipo de cambio con el documento afectado:
- Lo que ya existe en `<rutas.docs>`, el `README` y el `CHANGELOG` se **actualiza**.
- Lo que falta se **crea** con la plantilla correspondiente (`plantillas/doc-tecnica.md`, `plantillas/adr.md`, `plantillas/changelog.md`).

Respeta la estructura y el estilo de documentación que ya tenga el proyecto (MkDocs, Docusaurus, wiki en `docs/`…). Las plantillas son el último recurso, no una imposición.

## 3. Documentación obsoleta

Busca en `<rutas.docs>`, `README*` y comentarios de cabecera las **menciones a lo que cambió**:
- Símbolos renombrados o eliminados (funciones, endpoints, rutas, variables de configuración, comandos).
- Comportamientos que la historia modifica (valores por defecto, mensajes, pasos de uso).

```bash
git diff <rango> --name-status          # ficheros renombrados o borrados
git diff <rango> -U0 | grep '^-'        # líneas eliminadas: nombres que ya no existen
```

Para cada mención obsoleta: corrígela si pertenece a lo que documentas, o anótala en el informe si es ajena.

## 4. Proponer y escribir `⏸`

Muestra la lista de documentos con la acción (crear / actualizar / obsoleto) y el **diff propuesto** de cada uno. El usuario aprueba todo, una selección o pide cambios. Después, escribe en el repo.

Reglas de redacción:
- Para el lector del documento (usuario, desarrollador u operador), no para quien hizo el cambio.
- Ejemplos ejecutables y verificados contra el código: nombres reales, rutas reales, valores por defecto reales.
- Sin secretos ni datos de entornos reales.
- Enlaza la historia en el changelog y en el ADR.

## 5. Confluence (opcional) `⏸`

Solo si `confluence.espacio` está configurado. Sigue `referencias/confluence.md`: busca la página por título (para no duplicar), crea o actualiza bajo `confluence.pagina_padre` y **vincúlala a la historia** (`vincular` con `tipo: doc`).

## 6. Commit `⏸`

Ofrece un commit `docs(<ID>): <resumen>`:
- Si la rama de la historia sigue abierta, en esa rama.
- Si ya está fusionada, en una rama nueva `chore/<ID>-docs`, y sugiere crear un PR.

## 7. Informe

Según `referencias/informe.md` (ID de la historia, fase `documenta`). En *Resultados*:

| Documento | Acción | Motivo (cambio que lo provoca) |
|---|---|---|

Añade la documentación obsoleta detectada (corregida o pendiente), las páginas de Confluence y los huecos que no se pudieron cubrir.

**Siguientes pasos:** DoD-7 cumplido; si el PR está aprobado y las pruebas e2e pasan, la historia está lista para fusionar y cerrar (manual, D4).

## Referencias bajo demanda

| Cargar | Cuando |
|---|---|
| `referencias/protocolo-comun.md` | Siempre, al empezar |
| `referencias/adaptadores/git-<hosting>.md` | Paso 1 (PR fusionado) |
| `referencias/adaptadores/tracker-<modo>.md` | Pasos 1 y 5 |
| `referencias/mapa-documental.md`, `plantillas/*` | Paso 2 |
| `referencias/confluence.md` | Paso 5 |
| `referencias/convenciones/commits.md`, `referencias/convenciones/ramas.md` | Paso 6 |
| `referencias/informe.md` | Paso 7 |
