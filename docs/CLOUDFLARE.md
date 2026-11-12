# Prueba en Cloudflare Workers

## Estado de validaci�n: borrador, no desplegar todav�a

La configuraci�n y las cuatro pruebas del proxy est�n implementadas. Las
pruebas pasan y `git diff --check` no reporta errores. La instalaci�n local
fall� con ERR_PNPM_BROKEN_METADATA_JSON (timeout de npm); por ello todav�a
falta regenerar pnpm-lock.yaml, instalar dependencias, compilar Next/OpenNext
y verificar el bundle de Wrangler. El lockfile actual pertenece a la versi�n
anterior y una instalaci�n frozen fallar� hasta completar esa regeneraci�n.

Para continuar en un entorno con acceso estable a npm:

```sh
pnpm install --lockfile-only --ignore-scripts
pnpm install --frozen-lockfile
pnpm run test:cloudflare
pnpm run build:cloudflare
```

Revisar y versionar el nuevo lockfile antes del despliegue. Tampoco est�
configurado todav�a un backend aislado ni se ha probado el flujo de login,
pedidos y persistencia.

Esta adaptaci�n publica la web Next.js con OpenNext. El backend NestJS,
PostgreSQL y los archivos subidos permanecen en un servidor independiente.
No se migran datos ni se usan proyectos existentes.

## Configuraci�n de Workers Builds

- Repositorio: `ale973cl/delivery-pos-demo`.
- Rama de prueba: `feat/cloudflare-adapter`.
- Directorio ra�z: `/` (ra�z del monorepo).
- Comando de compilaci�n: vac�o; Wrangler ejecuta `build:cloudflare`.
- Comando de despliegue: `pnpm run deploy:cloudflare`.
- Nombre del Worker: `delivery-pos-demo` (debe coincidir con wrangler.jsonc).
- Node 22 o posterior; pnpm 11.10.0 seg�n packageManager.

El wrangler.jsonc de la ra�z evita la autodetecci�n incorrecta del workspace.
El build compila primero los tipos compartidos y despu�s convierte Next.js
al formato de Workers. No compila ni despliega NestJS.

## Backend aislado requerido

Configurar `BACKEND_URL` en las variables de **ejecuci�n** del Worker,
por ejemplo `https://backend-demo.example.com`, sin `/api`, credenciales,
query ni barra de ruta adicional. No escribir secretos en el repositorio.
El Worker reenv�a `/api` y `/socket.io` a ese origen; mantiene cookies,
m�todos, cuerpos y respuestas de actualizaci�n WebSocket.

Sin BACKEND_URL, las solicitudes API devuelven 503 expl�cito. Una web que
compila no acredita que login, ventas o persistencia est�n operativos.

En el backend de pruebas:

- PostgreSQL independiente y volumen persistente para subidas.
- JWT_SECRET aleatorio, COOKIE_SECURE=true y NODE_ENV=production.
- CORS_ORIGIN igual al origen HTTPS de este Worker.
- Configurar TRUST_PROXY con la cantidad real de proxies confiables de la
  infraestructura, no habilitar confianza global.
- Mantener el mismo origen p�blico para navegador, API y Socket.IO.
- Verificar que la cookie sea host-only (sin Domain del backend).

No colocar DATABASE_URL ni JWT_SECRET en variables NEXT_PUBLIC_*.
No conectar a datos reales para probar altas, pagos o cierres de caja.

## Validaci�n

```sh
pnpm run test:cloudflare
pnpm run build:cloudflare
pnpm --filter web exec wrangler deploy --config ../../wrangler.jsonc --dry-run
```

El dry-run ejecuta tambi�n el build configurado. Requiere dependencias
instaladas. En Windows OpenNext puede requerir WSL; Workers Builds usa Linux.

Despu�s de publicar una prueba y configurar el backend: verificar login,
cookie segura, crear un pedido ficticio, actualizaci�n en cocina desde una
segunda sesi�n, persistencia tras recarga y cierre de sesi�n. Las pruebas
unitarias del proxy no sustituyen este circuito completo.

La licencia AGPL y los avisos del autor se conservan. Esta adaptaci�n no
habilita facturaci�n SII ni adapta los impuestos a Chile.
