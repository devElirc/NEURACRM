import os
from pathlib import Path

from django.templatetags.static import static
from django.urls import reverse_lazy
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# Application definition
SHARED_APPS = [
    "unfold",  # Django Unfold admin theme
    "django_tenants",
    "apps.core",
    "django_extensions",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
]

TENANT_APPS = [
    "unfold",  # Django Unfold admin theme
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "apps.tenant_core",  # Tenant-specific Role, UserRole, AuditLog models
    "apps.leads",
    "apps.accounts",
    "apps.contacts",
    "apps.opportunities",
    "apps.subscriptions",
    "apps.campaigns",
    "apps.team_inbox",
]

INSTALLED_APPS = list(SHARED_APPS) + [
    app for app in TENANT_APPS if app not in SHARED_APPS
]

TENANT_MODEL = "core.Client"
TENANT_DOMAIN_MODEL = "core.Domain"

DATABASE_ROUTERS = ("django_tenants.routers.TenantSyncRouter",)

MIDDLEWARE = [
    "django_tenants.middleware.TenantMiddleware",
    "apps.core.middleware.SuperAdminAccessMiddleware",  # Restrict superadmin to public schema
    "apps.core.middleware.InactiveTenantMiddleware",  # Block inactive tenants
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
PUBLIC_SCHEMA_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database
DATABASES = {
    "default": {
        "ENGINE": "django_tenants.postgresql_backend",
        "NAME": os.getenv("DB_NAME", "crm_db"),
        "USER": os.getenv("DB_USER", "crm_user"),
        "PASSWORD": os.getenv("DB_PASSWORD", "crm_password"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media files
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.core.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# JWT Settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "60"))

# Session Settings (for Django Admin)
SESSION_COOKIE_AGE = 3600  # 1 hour (in seconds)
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_SAVE_EVERY_REQUEST = True

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

# Allow all tenant.localhost origins for development
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://\w+\.localhost:(3000|3001)$",
]

CORS_ALLOW_CREDENTIALS = True

# Custom User Model
AUTH_USER_MODEL = "core.User"

# Django Unfold Configuration
UNFOLD = {
    "SITE_TITLE": "NeuraCRM Admin",
    "SITE_HEADER": "NeuraCRM Administration",
    "SITE_URL": "/",
    "SITE_ICON": {
        "light": lambda request: static("admin/img/icon-light.svg"),
        "dark": lambda request: static("admin/img/icon-dark.svg"),
    },
    "SITE_LOGO": {
        "light": lambda request: static("admin/img/logo-light.svg"),
        "dark": lambda request: static("admin/img/logo-dark.svg"),
    },
    "SITE_SYMBOL": "speed",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "ENVIRONMENT": "NeuraCRM3.settings.dev",
    "DASHBOARD_CALLBACK": "apps.core.admin.dashboard_callback",
    "STYLES": [
        lambda request: static("admin/css/neuracrm-admin.css"),
    ],
    "COLORS": {
        "primary": {
            "50": "248 250 252",
            "100": "241 245 249",
            "200": "226 232 240",
            "300": "203 213 225",
            "400": "148 163 184",
            "500": "99 102 241",
            "600": "79 70 229",
            "700": "67 56 202",
            "800": "55 48 163",
            "900": "49 46 129",
            "950": "30 27 75",
        },
    },
    "EXTENSIONS": {
        "modeltranslation": {
            "flags": {
                "en": "🇬🇧",
                "fr": "🇫🇷",
                "nl": "🇳🇱",
            },
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": True,
        "navigation": [
            {
                "title": "Authentication & Users",
                "separator": True,
                "items": [
                    {
                        "title": "Users",
                        "icon": "person",
                        "link": lambda request: reverse_lazy("tenant_admin:tenant_core_tenantuser_changelist"),
                    },
                    {
                        "title": "Roles",
                        "icon": "security",
                        "link": lambda request: reverse_lazy("tenant_admin:tenant_core_role_changelist"),
                    },
                    {
                        "title": "User Roles",
                        "icon": "group",
                        "link": lambda request: reverse_lazy("tenant_admin:tenant_core_userrole_changelist"),
                    },
                ],
            },
            {
                "title": "CRM Modules",
                "separator": True,
                "items": [
                    {
                        "title": "Leads",
                        "icon": "campaign",
                        "link": "#",
                    },
                    {
                        "title": "Contacts",
                        "icon": "contacts",
                        "link": "#",
                    },
                    {
                        "title": "Accounts",
                        "icon": "business",
                        "link": "#",
                    },
                    {
                        "title": "Opportunities",
                        "icon": "trending_up",
                        "link": "#",
                    },
                    {
                        "title": "Campaigns",
                        "icon": "campaign",
                        "link": lambda request: reverse_lazy("tenant_admin:campaigns_campaign_changelist"),
                    },
                ],
            },
            {
                "title": "System",
                "separator": True,
                "items": [
                    {
                        "title": "Audit Logs",
                        "icon": "history",
                        "link": lambda request: reverse_lazy("tenant_admin:tenant_core_auditlog_changelist"),
                    },
                ],
            },
        ],
    },
    "TABS": [],
}

# Google OAuth Settings
GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "757122969965-h4i287jiv8n5d6jbaergafq3ddki132e.apps.googleusercontent.com",
)
GOOGLE_CLIENT_SECRET = os.getenv(
    "GOOGLE_CLIENT_SECRET",
    "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",
)
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "http://localhost:8000/api/inbox/auth/google/callback"
)
