import assert from "node:assert/strict";
import test from "node:test";
import { backendTarget, isBackendPath, proxyBackend } from "./proxy.js";

test("proxy preserves API paths and Socket.IO query strings", () => {
  assert.equal(backendTarget("https://demo.test/socket.io/?EIO=4&transport=polling", "https://backend.test").href,
    "https://backend.test/socket.io/?EIO=4&transport=polling");
  for (const path of ["/api", "/api/auth/login", "/socket.io", "/socket.io/"]) assert.ok(isBackendPath(path));
  assert.equal(isBackendPath("/apiary"), false);
});
test("rejects unsafe or looping backend configuration", () => {
  for (const origin of ["http://backend.test", "https://demo.test", "https://user:pass@backend.test", "https://backend.test/api"]) {
    assert.throws(() => backendTarget("https://demo.test/api/auth", origin));
  }
});
test("preserves session cookies and upstream errors, strips spoofed IP", async () => {
  const request = new Request("https://demo.test/api/auth/me", { headers: { cookie: "nodedr_session=test", "x-forwarded-for": "spoof" } });
  const result = await proxyBackend(request, { BACKEND_URL: "https://backend.test" }, async (forwarded) => {
    assert.equal(forwarded.headers.get("cookie"), "nodedr_session=test");
    assert.equal(forwarded.headers.get("x-forwarded-for"), null);
    assert.equal(forwarded.redirect, "manual");
    return new Response("unauthorized", { status: 401, headers: { "set-cookie": "nodedr_session=; Path=/; HttpOnly; Secure" } });
  });
  assert.equal(result.status, 401);
  assert.ok(result.headers.get("set-cookie").includes("HttpOnly"));
});
test("missing backend fails explicitly instead of pretending to persist", async () => {
  assert.equal((await proxyBackend(new Request("https://demo.test/api/orders"), {})).status, 503);
});
