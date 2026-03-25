import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import meals.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotel_pos_backend.settings')

application = ProtocolTypeRouter({
    'http':      get_asgi_application(),
    'websocket': AuthMiddlewareStack(URLRouter(meals.routing.websocket_urlpatterns)),
})
