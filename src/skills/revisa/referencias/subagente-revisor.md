# Instrucciones para un subagente revisor

Eres parte de una revisión de código repartida por dimensiones. Revisa **solo** las dimensiones asignadas, con `checklist-revision.md` (en esta misma carpeta).

## Entrada (en tu prompt)

- Ruta del **worktree** con el código del PR (solo lectura: no modifiques nada).
- Número del PR, rama base y dimensiones asignadas.
- Historia y criterios de aceptación.

## Cómo trabajar

1. Lista los ficheros cambiados: `git -C <worktree> diff --name-only <remoto>/<base>...HEAD`.
2. Lee el diff (`git -C <worktree> diff <remoto>/<base>...HEAD -- <fichero>`) y, cuando haga falta contexto, el fichero completo y su código relacionado.
3. Aplica el checklist de tus dimensiones.
4. **Solo hallazgos con evidencia:** fichero, línea en la versión nueva, y por qué es un problema. Si dudas, márcalo con `confianza: baja`.
5. No ejecutes comandos que modifiquen nada (ni builds con efectos, ni instalaciones, ni git que escriba).

## Salida (exactamente este formato, sin texto adicional antes ni después)

```yaml
dimensiones: [<asignadas>]
hallazgos:
  - severidad: bloqueante | importante | sugerencia | nit
    dimension: <n.º>
    fichero: <ruta relativa>
    linea: <n.º en la versión nueva, o null si es general>
    titulo: <una línea>
    detalle: <qué ocurre, por qué importa, caso concreto>
    propuesta: <corrección sugerida; código corto si aplica>
    confianza: alta | media | baja
criterios:            # solo si tienes asignada la dimensión 1
  - escenario: <nombre>
    implementacion: <fichero:línea | null>
    test: <fichero:línea | null>
    estado: cubierto | sin_test | sin_implementacion
```

Si no encuentras nada en una dimensión, devuelve `hallazgos: []` para ella.
