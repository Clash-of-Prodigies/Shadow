export async function onRequest({ request, params }) {
  const incomingUrl = new URL(request.url);

  const ALLOWED_ORIGINS = new Set([
    "https://auth.clashofprodigies.org",
    "https://app.clashofprodigies.org",
  ]);

  const origin = request.headers.get("Origin") || "";
  const originAllowed = origin && ALLOWED_ORIGINS.has(origin);

  const allowMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
  const requestedHeaders = request.headers.get("Access-Control-Request-Headers");
  const allowHeaders = requestedHeaders || "authorization,content-type";

  const isPreflight =
    request.method === "OPTIONS" &&
    request.headers.has("Origin") &&
    request.headers.has("Access-Control-Request-Method");

  // ---------- Preflight handled at the worker ----------
  if (isPreflight) {
    // If the Origin is not allowed, fail fast (browser will block anyway).
    if (!originAllowed) return new Response(null, { status: 403 });

    const h = new Headers();
    h.set("Access-Control-Allow-Origin", origin);
    h.set("Access-Control-Allow-Credentials", "true");
    h.set("Access-Control-Allow-Methods", allowMethods);
    h.set("Access-Control-Allow-Headers", allowHeaders);
    h.set("Access-Control-Max-Age", "86400");
    h.set("Vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers");

    return new Response(null, { status: 204, headers: h });
  }

  const pathParts = Array.isArray(params.path)
    ? params.path
    : (params.path ? [params.path] : []);

  const upstream = new URL("https://sobbingly-hydrochloric-joel.ngrok-free.dev/");
  upstream.pathname = "/" + pathParts.join("/");
  upstream.search = incomingUrl.search;

  const headers = new Headers(request.headers);

  const token = getCookie(headers.get("cookie"), "access_token");
  if (token) headers.set("authorization", `Bearer ${token}`);

  headers.delete("origin");

  const upstreamResp = await fetch(upstream.toString(), {
    method: request.method,
    headers,
    body: (request.method === "GET" || request.method === "HEAD") ? null : request.body,
    redirect: "manual",
  });

  // ---------- Add CORS headers to actual response ----------
  const respHeaders = new Headers(upstreamResp.headers);

  if (originAllowed) {
    respHeaders.set("Access-Control-Allow-Origin", origin);
    respHeaders.set("Access-Control-Allow-Credentials", "true");
    respHeaders.set("Vary", "Origin");
  }

  return new Response(upstreamResp.body, {
    status: upstreamResp.status,
    statusText: upstreamResp.statusText,
    headers: respHeaders,
  });
}

function getCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}