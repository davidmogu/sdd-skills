# Checklist de cierre

Se genera al final de `/desarrolla` y se copia **íntegro** en la descripción del PR. Es la evidencia de que la historia está hecha. No marques nada como ✅ sin evidencia verificable.

## 1. Criterios de aceptación

Una fila por escenario Gherkin (por ejemplo del *Esquema del escenario* si cada uno se prueba por separado):

| # | Escenario | Evidencia | Estado |
|---|---|---|---|
| E1 | Filtro por un rango válido | `test/pedidos.test.js:12` *filtra por rango de fechas* | ✅ |
| E2 | Los cancelados no aparecen | `test/pedidos.test.js:20` | ✅ |
| E3 | Fechas según la zona horaria | Sin test automático: requiere `/prueba` | ⏳ |

- ✅ = hay un test que lo comprueba **y pasa**, u otra evidencia objetiva (salida de un comando, captura).
- ⏳ = se comprobará con `/prueba` (flujo de usuario o visual). No bloquea el PR, pero se indica.
- ❌ = no está cubierto o falla. **Bloquea el PR.**

Para encontrar la evidencia, busca en los tests añadidos o modificados en la rama (`git diff --name-only <remoto>/<base>...HEAD`) el que ejercita el comportamiento del escenario. Si no hay ninguno, el estado es ❌, aunque el código "parezca" correcto.

## 2. Definition of Done

Con la DoD de la config (o la estándar):

| ID | Criterio | Estado | Evidencia / cómo completarlo |
|---|---|---|---|
| DoD-1 | Criterios cumplidos con evidencia | ✅ | Tabla anterior (los ⏳ quedan para `/prueba`) |
| DoD-2 | Lint y tests en verde | ✅ | `npm run lint` OK · `npm test`: 42 ✔ 0 ✖ |
| DoD-3 | Tests nuevos | ✅ | 2 ficheros de test en el diff |
| DoD-4 | Convenciones de rama y commits | ✅ | Validadas con las regex |
| DoD-5 | PR y revisión aprobada | ⏳ | `/revisa <n.º PR>` |
| DoD-6 | Validación e2e | ⏳ | `/prueba <ID>` |
| DoD-7 | Documentación | ⏳ | `/documenta <ID>` |

Si la DoD de la config tiene otros puntos, evalúa cada uno igual: ✅ con evidencia, ⏳ con el paso que lo completa, o ❌.

## 3. Convenciones

```bash
git rev-parse --abbrev-ref HEAD                       # rama → regex de ramas.md
git log --format=%s <remoto>/<base>..HEAD             # cada commit → regex de commits.md
```

Lista los commits que no cumplan. Si los hay, ofrece corregirlos **antes del push** (`git commit --amend` o `git rebase` con `⏸`, explicando que reescribe la historia local). Nunca reescribas commits ya publicados sin permiso explícito.

## 4. Resultado

- **Listo para PR:** sin ❌ en criterios ni en DoD-1 a DoD-4.
- **No listo:** cualquier ❌ en esos puntos. Explica qué falta, en orden de importancia.
