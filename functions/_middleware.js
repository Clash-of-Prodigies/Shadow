const ALLOWED_ORIGINS = new Set([
  "https://auth.clashofprodigies.org",
]);

export async function onRequest(context) {
  const req = context.request;

  const origin = req.headers.get("Origin") || "";
  const originAllowed = origin && ALLOWED_ORIGINS.has(origin);

  const isPreflight =
    req.method === "OPTIONS" &&
    req.headers.has("Origin") &&
    req.headers.has("Access-Control-Request-Method");

  if (isPreflight) {
    if (!originAllowed) return new Response(null, { status: 403 });

    const reqHeaders = req.headers.get("Access-Control-Request-Headers") || "content-type";
    const h = new Headers();
    h.set("Access-Control-Allow-Origin", origin);
    h.set("Access-Control-Allow-Credentials", "true");
    h.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    h.set("Access-Control-Allow-Headers", reqHeaders);
    h.set("Access-Control-Max-Age", "86400");
    h.set("Vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
    return new Response(null, { status: 204, headers: h });
  }

  const resp = await context.next();

  // Add CORS to actual response too
  if (!originAllowed) return resp;

  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Vary", "Origin");

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers,
  });
}
