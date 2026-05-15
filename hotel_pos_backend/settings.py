from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

def _env_bool(name, default=False):
    value = config(name, default=default)
    if isinstance(value, bool):
        return value

    normalized = str(value).strip().lower()
    if normalized in {'1', 'true', 'yes', 'y', 'on', 'debug', 'development', 'dev'}:
        return True
    if normalized in {'0', 'false', 'no', 'n', 'off', 'release', 'prod', 'production'}:
        return False

    raise ValueError(f'Invalid truth value for {name}: {value}')


def _clean_setting(value):
    return str(value or '').strip().strip('"').strip("'")

SECRET_KEY    = config('SECRET_KEY')
DEBUG         = _env_bool('DEBUG', default=False)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost', cast=Csv())

INSTALLED_APPS = [
    'daphne',                                    # must be first for ASGI
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',
    'authentication',
    'meals',
    'pos',
    'events',
    'partners',
    'reports',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # must be first
    'django.middleware.security.SecurityMiddleware',
    'hotel_pos_backend.middleware.CoopMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'hotel_pos_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'hotel_pos_backend.wsgi.application'
ASGI_APPLICATION  = 'hotel_pos_backend.routing.application'

# ── Channel layer ──────────────────────────────────────────────────────────────
_REDIS_URL = config('REDIS_URL', default='')
if _REDIS_URL:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG':  {'hosts': [_REDIS_URL]},
        }
    }
else:
    # Development fallback — single-process only, no cross-worker broadcast
    CHANNEL_LAYERS = {
        'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}
    }

# ── Database ──────────────────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     config('DB_NAME'),
        'USER':     config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST':     config('DB_HOST', default='localhost'),
        'PORT':     config('DB_PORT', default='5432'),
    }
}

# ── Auth ──────────────────────────────────────────────────────────────────────
AUTH_USER_MODEL = 'authentication.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── DRF ───────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'authentication.jwt.CredentialAwareJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# ── JWT ───────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000',
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost:3000',
    cast=Csv(),
)

# ── Internationalisation ──────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'Asia/Colombo'
USE_I18N      = True
USE_TZ        = True

STATIC_URL = '/static/'
STATICFILES_DIRS = []
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = Path(config('MEDIA_ROOT', default=str(BASE_DIR / 'media'))).expanduser()
MEDIA_SEED_ROOT = Path(config('MEDIA_SEED_ROOT', default=str(BASE_DIR / 'media'))).expanduser()

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET', default='')
GEOCODER_USER_AGENT  = config('GEOCODER_USER_AGENT', default='CafeLushDelivery/1.0')
NOMINATIM_BASE_URL   = config('NOMINATIM_BASE_URL', default='https://nominatim.openstreetmap.org/search')

# ── Email (SMTP) ──────────────────────────────────────────────────────────────
EMAIL_PROVIDER      = _clean_setting(config('EMAIL_PROVIDER',      default='smtp')).lower() or 'smtp'
EMAIL_BACKEND       = _clean_setting(config('EMAIL_BACKEND',       default=''))
if not EMAIL_BACKEND:
    EMAIL_BACKEND = (
        'hotel_pos_backend.email_backends.ResendEmailBackend'
        if EMAIL_PROVIDER == 'resend'
        else 'django.core.mail.backends.smtp.EmailBackend'
    )
EMAIL_HOST          = config('EMAIL_HOST',          default='smtp.gmail.com')
EMAIL_PORT          = config('EMAIL_PORT',          default=587, cast=int)
EMAIL_USE_TLS       = _env_bool('EMAIL_USE_TLS',    default=True)
EMAIL_HOST_USER     = config('EMAIL_HOST_USER',     default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_TIMEOUT       = config('EMAIL_TIMEOUT',       default=10, cast=int)
DEFAULT_FROM_EMAIL  = config('DEFAULT_FROM_EMAIL',  default='Cafe Lush <noreply@cafelush.com>')
RESEND_API_KEY      = config('RESEND_API_KEY',      default='')
RESEND_API_URL      = config('RESEND_API_URL',      default='https://api.resend.com/emails')
OWNER_ORDER_EMAIL   = config('OWNER_ORDER_EMAIL',   default=EMAIL_HOST_USER)
OWNER_ORDER_EMAIL_ASYNC = _env_bool('OWNER_ORDER_EMAIL_ASYNC', default=True)
