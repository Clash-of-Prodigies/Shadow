from urllib.parse import urlparse
from flask import Request
import requests

def is_allowed_origin(origin: str, ALLOWED_ROOTS: list[str]) -> bool:
    if not origin:
        return False
    parsed = urlparse(origin)
    host = parsed.hostname
    if not host:
        return False
    return any(host == root for root in ALLOWED_ROOTS)

def introspect_with_cerberus(AUTH_SERVICE_URL: str, request: Request) -> None:
    auth_header = request.headers.get('Authorization')
    token = ''
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(' ', 1)[1].strip()
    if not token and 'jwt' in request.cookies:
        token = request.cookies.get('jwt', '')
    if not token:
        raise ValueError("Missing token")
    res = requests.get(AUTH_SERVICE_URL, headers={
        **request.headers,
        "Authorization": f"Bearer {token}",
    })
    if res.status_code != 204:
        raise ValueError("Unauthenticated")