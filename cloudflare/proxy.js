// Preserve the browser's same-origin cookies and Socket.IO connection.
export function backendTarget(requestUrl, backendUrl) {
  const incoming = new URL(requestUrl);
  const backend = new URL(backendUrl);
  if (backend.protocol !== "https:" || backend.username || backend.password ||
      backend.pathname !== "/" || backend.search || backend.hash ||
      backend.origin === incoming.origin) {
    throw new Error("BACKEND_URL must be a different HTTPS origin without a path or credentials");
  }
  return new URL(incoming.pathname + incoming.search, backend.origin);
}

export function isBackendPath(pathname) {
  return pathname === "/api" || pathname.startsWith("/api/") ||
    pathname === "/socket.io" || pathname.startsWith("/socket.io/");
}

export async function proxyBackend(request, env, send = fetch) {
  if (!env.BACKEND_URL) {
    return Response.json({ message: "Backend de pruebas pendiente de configurar" }, { status: 503 });
  }
  try {
    const target = backendTarget(request.url, env.BACKEND_URL);
    const forwarded = new Request(target, request);
    // Do not trust client-provided forwarding headers.
    forwarded.headers.delete("forwarded");
    forwarded.headers.delete("x-forwarded-for");
    forwarded.headers.delete("x-real-ip");
    forwarded.headers.set("x-forwarded-proto", "https");
    forwarded.headers.set("x-forwarded-host", new URL(request.url).host);
    if (request.headers.get("cf-connecting-ip")) {
      forwarded.headers.set("x-forwarded-for", request.headers.get("cf-connecting-ip"));
    }
    // Manual redirects prevent forwarding session cookies to a redirected host.
    // Return the upstream response directly, including WebSocket upgrades.
    return await send(new Request(forwarded, { redirect: "manual" }));
  } catch {
    return Response.json({ message: "Backend de pruebas no disponible" }, { status: 502 });
  }
}
