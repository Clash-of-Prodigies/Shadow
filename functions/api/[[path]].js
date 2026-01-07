export async function onRequest({ request, params }) {
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

  return fetch(upstream.toString(), {
    method: request.method,
    headers,
    body: (request.method === "GET" || request.method === "HEAD") ? null : request.body,
    redirect: "manual",
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
