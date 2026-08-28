from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
import urllib.parse

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        access_token = AccessToken(token_key)
        user_id = access_token.get('user_id')
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()

class JWTAuthMiddleware:
    """
    Custom Channels middleware to authenticate WebSocket requests using SimpleJWT tokens.
    Extracts token from query string parameter `?token=<jwt_token>` or `Authorization: Bearer <token>` header.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        raw_qs = scope.get('query_string', b'')
        if isinstance(raw_qs, bytes):
            qs_str = raw_qs.decode('utf-8')
        else:
            qs_str = str(raw_qs)

        query_params = urllib.parse.parse_qs(qs_str)
        token = None

        if 'token' in query_params:
            token = query_params['token'][0]
        else:
            headers = dict(scope.get('headers', []))
            if b'authorization' in headers:
                auth_header = headers[b'authorization'].decode('utf-8')
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]

        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()


        return await self.inner(scope, receive, send)
