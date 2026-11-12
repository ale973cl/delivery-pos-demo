import nextWorker from "../apps/web/.open-next/worker.js";
import { isBackendPath, proxyBackend } from "./proxy.js";

export default {
  async fetch(request, env, ctx) {
    if (isBackendPath(new URL(request.url).pathname)) {
      return proxyBackend(request, env);
    }
    return nextWorker.fetch(request, env, ctx);
  },
};
