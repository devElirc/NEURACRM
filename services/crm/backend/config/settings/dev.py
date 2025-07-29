from .base import *

# Debug settings
DEBUG = True

# Database
DATABASES["default"]["OPTIONS"] = {
    "sslmode": "disable",
}

# Debug toolbar
if DEBUG:
    INSTALLED_APPS += ["debug_toolbar"]
    MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")

    INTERNAL_IPS = [
        "127.0.0.1",
        "localhost",
    ]

# Email backend for development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django_tenants": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "apps.tenant_core.admin": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
