---
name: hola
description: Skill de verificación (spike F0). Comprueba invocación, argumentos y lectura de referencias. Eliminar antes de v0.1.0.
argument-hint: "[nombre]"
disable-model-invocation: true
---

# /hola — spike de verificación

Responde SOLO con estas cuatro líneas, sin texto adicional:

1. `ARGS=<argumentos recibidos>` — los argumentos son: $ARGUMENTS
2. `LOCAL=<token>` — el token que aparece en `referencias/saludo.md` (relativo a la carpeta de esta skill).
3. `COMPARTIDO=<token>` — el token que aparece en `referencias/spike/compartido.md`.
4. `DIR=<ruta absoluta de la carpeta de esta skill>`
