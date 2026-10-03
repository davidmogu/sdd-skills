# Evals en modo Jira

Escriben en un proyecto **real** de Jira. Por eso están fuera de la suite normal: ni `npm test` ni la pasada general las ejecutan.

- **Proyecto:** `config-jira.sh` apunta al proyecto `SDD` de pruebas, que **se borró el 2026-10-03** tras verificar las skills. Para volver a ejecutarlas, crea un proyecto de software team-managed y actualiza en `config-jira.sh` la clave, los IDs de estado (`listJiraStatuses`) y el campo de story points.
- **Requisitos:** el MCP de Atlassian conectado en Claude Code y, para `jira-desarrolla`, una historia en *To Do* que cumpla la DoR (ajusta la clave en `jira-desarrolla/prompt.md`).
- **Coste de una pasada:** ~2 $.

```bash
node evals/_arnes/ejecutar.mjs --dir evals/_jira -j 3 --max-cost-usd 4
```

Los títulos que se crean llevan el prefijo «[Prueba SDD]».
