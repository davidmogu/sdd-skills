#!/bin/bash
# Scaffold de la eval: se ejecuta en el workspace vacío (cwd).
set -euo pipefail
git init -q -b main && git config user.email e@x.com && git config user.name Eval
cat > pom.xml <<'X'
<project><modelVersion>4.0.0</modelVersion><groupId>ej</groupId><artifactId>tienda</artifactId><version>1</version>
<build><plugins><plugin><artifactId>maven-failsafe-plugin</artifactId></plugin></plugins></build></project>
X
printf '#!/bin/sh\necho mvnw\n' > mvnw && chmod +x mvnw
mkdir -p src/main/resources && printf 'server.port=9090\n' > src/main/resources/application.properties
git add -A && git commit -q -m init && git branch develop
git remote add origin git@gitlab.com:eval/backend/tienda.git
