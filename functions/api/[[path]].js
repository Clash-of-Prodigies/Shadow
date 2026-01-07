const ALLOWED_ORIGINS = new Set([
  "https://auth.clashofprodigies.org",
  // add others as needed
]);

export const onRequestOptions = async ({ request }) => {
  return handlePreflight(request);
};

export const onRequest = async ({ request, params }) => {
  // Handle CORS preflight if it ever reaches here as OPTIONS
  if (request.method === "OPTIONS") return handlePreflight(request);

  const incomingUrl = new URL(request.url);

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

  // Add CORS to the actual response too
  const respHeaders = new Headers(upstreamResp.headers);
  applyCorsToResponse(request, respHeaders);

  return new Response(upstreamResp.body, {
    status: upstreamResp.status,
    statusText: upstreamResp.statusText,
    headers: respHeaders,
  });
};

function handlePreflight(request) {
  const origin = request.headers.get("Origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) return new Response(null, { status: 403 });

  const reqHeaders = request.headers.get("Access-Control-Request-Headers") || "content-type";
  const h = new Headers();
  h.set("Access-Control-Allow-Origin", origin);
  h.set("Access-Control-Allow-Credentials", "true");
  h.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  h.set("Access-Control-Allow-Headers", reqHeaders);
  h.set("Access-Control-Max-Age", "86400");
  h.set("Vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
  h.set("X-CORS-Preflight", "1"); // debug marker so you can confirm it is your code

  return new Response(null, { status: 204, headers: h });
}

function applyCorsToResponse(request, respHeaders) {
  const origin = request.headers.get("Origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) return;

  respHeaders.set("Access-Control-Allow-Origin", origin);
  respHeaders.set("Access-Control-Allow-Credentials", "true");
  respHeaders.set("Vary", "Origin");
}

function getCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}
