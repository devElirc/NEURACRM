from datetime import datetime, timedelta

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

# Constants
PUBLIC_SCHEMA_NAME = "public"
BEARER_PREFIX = "Bearer "

User = get_user_model()


class JWTAuthentication(BaseAuthentication):
    """
    Custom JWT authentication
    """

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION")

        if not auth_header or not auth_header.startswith(BEARER_PREFIX):
            return None

        try:
            token_parts = auth_header.split(" ")
            if len(token_parts) != 2:
                return None
            token = token_parts[1]
        except IndexError:
            return None

        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )

            user_id = payload.get("user_id")
            token_tenant_schema = payload.get("tenant_schema")

            if not user_id:
                raise AuthenticationFailed("Invalid token payload")

            # Get current tenant from request
            current_tenant = getattr(request, 'tenant', None)
            if current_tenant and token_tenant_schema:
                if current_tenant.schema_name != token_tenant_schema:
                    raise AuthenticationFailed("Token not valid for this tenant")

            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise AuthenticationFailed("User not found")

            if not user.is_active:
                raise AuthenticationFailed("User account is disabled")

            # Verify user belongs to current tenant
            # (NO EXCEPTIONS - even superadmin must belong to tenant)
            if current_tenant and current_tenant.schema_name != PUBLIC_SCHEMA_NAME:
                try:
                    if not user.tenants.filter(schema_name=current_tenant.schema_name).exists():
                        raise AuthenticationFailed("User not authorized for this tenant")
                except Exception as e:
                    # Database error during tenant verification
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Tenant verification error for user {user_id}: {e}")
                    raise AuthenticationFailed("Tenant verification failed")

            return (user, token)

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid token")
        except AuthenticationFailed:
            # Re-raise our custom authentication errors
            raise
        except Exception as e:
            # Catch any unexpected errors
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Unexpected authentication error: {e}")
            raise AuthenticationFailed("Authentication failed")

    def authenticate_header(self, request):
        return "Bearer"


class JWTTokenGenerator:
    """
    JWT token generator utility
    """

    @staticmethod
    def generate_tokens(user, tenant_schema=None):
        """
        Generate access and refresh tokens for user with tenant scope
        """
        access_payload = {
            "user_id": str(user.id),
            "email": user.email,
            "tenant_schema": tenant_schema,
            "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES),
            "iat": datetime.utcnow(),
            "type": "access"
        }

        refresh_payload = {
            "user_id": str(user.id),
            "tenant_schema": tenant_schema,
            "exp": datetime.utcnow() + timedelta(days=7),
            "iat": datetime.utcnow(),
            "type": "refresh"
        }

        access_token = jwt.encode(
            access_payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )

        refresh_token = jwt.encode(
            refresh_payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": settings.JWT_EXPIRATION_MINUTES * 60,
            "token_type": "Bearer"
        }

    @staticmethod
    def refresh_access_token(refresh_token):
        """
        Generate new access token from refresh token
        """
        try:
            payload = jwt.decode(
                refresh_token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )

            if payload.get("type") != "refresh":
                raise AuthenticationFailed("Invalid token type")

            user_id = payload.get("user_id")
            user = User.objects.get(id=user_id)

            if not user.is_active:
                raise AuthenticationFailed("User account is disabled")

            # Generate new access token with same tenant scope
            tenant_schema = payload.get("tenant_schema")
            access_payload = {
                "user_id": str(user.id),
                "email": user.email,
                "tenant_schema": tenant_schema,
                "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES),
                "iat": datetime.utcnow(),
                "type": "access"
            }

            access_token = jwt.encode(
                access_payload,
                settings.JWT_SECRET_KEY,
                algorithm=settings.JWT_ALGORITHM
            )

            return {
                "access_token": access_token,
                "expires_in": settings.JWT_EXPIRATION_MINUTES * 60,
                "token_type": "Bearer"
            }

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Refresh token has expired")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid refresh token")
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found")

    @staticmethod
    def verify_token(token):
        """
        Verify and decode JWT token
        """
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )

            # Verify token type
            if payload.get("type") != "access":
                raise AuthenticationFailed("Invalid token type")

            # Check if token is expired
            exp = payload.get("exp")
            if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
                raise AuthenticationFailed("Token has expired")

            return payload

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid token")
        except Exception as e:
            raise AuthenticationFailed(f"Token verification failed: {str(e)}")
