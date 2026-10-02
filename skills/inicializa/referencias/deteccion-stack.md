# Detección de stack y comandos

Busca los manifiestos en la raíz del repo y, si no hay ninguno, un nivel por debajo. Si hay **varios stacks** o un monorepo (`workspaces` en `package.json`, `pnpm-workspace.yaml`, varios `pom.xml`, `settings.gradle` con módulos), pregunta qué comandos usar: los de la raíz, que suelen agregar los módulos, o los de un módulo concreto.

Propón siempre; **nunca** ejecutes los comandos durante `/inicializa` (pueden tardar o tener efectos).

## Por manifiesto

| Manifiesto | Gestor | `lint` | `test_unit` | `test_integracion` | `test_e2e` |
|---|---|---|---|---|---|
| `package.json` | npm · `yarn.lock` → yarn · `pnpm-lock.yaml` → pnpm · `bun.lockb` → bun | script `lint` | script `test` (o `test:unit`) | script `test:integration`, `test:int` o `test:integracion` | script `test:e2e` o `e2e`; si existe `playwright.config.*` → `npx playwright test` |
| `pom.xml` | `./mvnw` si existe; si no, `mvn` | `checkstyle:check` o `spotless:check` si están los plugins | `<mvn> test` | `<mvn> verify` si hay `maven-failsafe-plugin` | — |
| `build.gradle(.kts)` | `./gradlew` | `spotlessCheck`, `ktlintCheck` o `detekt` si están los plugins; si no, `check` | `./gradlew test` | `./gradlew integrationTest` si existe la tarea | — |
| `pyproject.toml` / `requirements*.txt` / `setup.cfg` | `uv run`, `poetry run` o directo, según el lock | `ruff check .`, o `flake8` si está configurado | `pytest` (o `pytest tests/unit` si existe) | `pytest tests/integration` si existe | `pytest tests/e2e` o `playwright` si aparece en las dependencias |
| `go.mod` | go | `golangci-lint run` si hay `.golangci.*`; si no, `go vet ./...` | `go test ./...` | `go test -tags=integration ./...` si se usa ese tag | — |
| `*.sln` / `*.csproj` | dotnet | `dotnet format --verify-no-changes` | `dotnet test` | proyecto `*.IntegrationTests` → `dotnet test <proyecto>` | — |
| `Cargo.toml` | cargo | `cargo clippy -- -D warnings` | `cargo test` | `cargo test --test '*'` si hay `tests/` | — |

Con npm, escribe los scripts como `npm run <script>` (salvo `npm test`). Con yarn o pnpm, `yarn <script>` o `pnpm <script>`.

## URL base para e2e

| Señal | `e2e.url_base` |
|---|---|
| `baseURL` en `playwright.config.*` | ese valor |
| Vite (`vite` en las dependencias) | `http://localhost:5173` |
| Next.js, CRA, Remix, Express (`next`, `react-scripts`…) | `http://localhost:3000` |
| Angular (`@angular/core`) | `http://localhost:4200` |
| Spring Boot (`spring-boot` en el pom o en Gradle) | `http://localhost:8080`, o `server.port` de `application.(yml\|properties)` |
| Django / FastAPI | `http://localhost:8000` |
| Sin pista | pregunta; si no hay interfaz web, deja `""` y `test_e2e: ""` |

## Ruta de tests e2e

Si `playwright.config.*` define `testDir`, úsalo (con `/` al final). Si no, el valor por defecto es `e2e/`.
