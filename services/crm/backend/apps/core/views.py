import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import JWTTokenGenerator
from .models import Client, Domain
from .serializers import (
    LoginSerializer,
    PasswordChangeSerializer,
    TokenRefreshSerializer,
    TenantSerializer
)
from .utils import auth_rate_limit, create_audit_log

logger = logging.getLogger(__name__)

def handle_safe_error(error_message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, details=None):
    """Handle errors with sanitized messages for production"""
    if not settings.DEBUG:
        sanitized_messages = {
            400: "Bad request", 401: "Authentication required", 403: "Access denied",
            404: "Resource not found", 429: "Too many requests", 500: "Internal server error"
        }
        response_data = {"error": sanitized_messages.get(status_code, "An error occurred")}
        logger.error(f"Error (sanitized): {error_message}")
        if details:
            logger.error(f"Error details: {details}")
    else:
        response_data = {"error": error_message}
        if details:
            response_data["details"] = details
    return Response(response_data, status=status_code)

# Constants
PUBLIC_SCHEMA_NAME = "public"
BEARER_PREFIX = "Bearer "

User = get_user_model()


class LoginView(APIView):
    """
    User login view with tenant verification
    """
    permission_classes = [permissions.AllowAny]

    @auth_rate_limit
    def post(self, request):
        try:
            # Debug logging
            logger.info("🔍 LOGIN REQUEST DEBUG:")
            logger.info(f"  - Data: {request.data}")
            logger.info(f"  - Content-Type: {request.content_type}")
            logger.info(f"  - Origin: {request.META.get('HTTP_ORIGIN')}")
            logger.info(f"  - Host: {request.META.get('HTTP_HOST')}")
            logger.info(f"  - Remote IP: {request.META.get('REMOTE_ADDR')}")
            logger.info(f"  - User-Agent: {request.META.get('HTTP_USER_AGENT')}")

            serializer = LoginSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.validated_data["user"]

                # Get current tenant from request
                current_tenant = getattr(request, 'tenant', None)

                # Verify user belongs to current tenant
                # (NO EXCEPTIONS - even superadmin must belong to tenant)
                if current_tenant and current_tenant.schema_name != PUBLIC_SCHEMA_NAME:
                    if not user.tenants.filter(schema_name=current_tenant.schema_name).exists():
                        return handle_safe_error(
                            "User not authorized for this tenant",
                            status.HTTP_401_UNAUTHORIZED,
                            {"tenant": current_tenant.schema_name}
                        )

                # Generate tenant-scoped tokens
                tenant_schema = current_tenant.schema_name if current_tenant else None
                tokens = JWTTokenGenerator.generate_tokens(user, tenant_schema)

                # Create audit log (with error handling)
                try:
                    create_audit_log(
                        user=user,
                        action="login",
                        model_name="User",
                        object_id=str(user.id),
                        request=request
                    )
                except Exception as e:
                    # Log audit failure but don't block login
                    logger.warning(f"Failed to create audit log for user {user.email}: {e}")

                # Import here to avoid circular import
                from .serializers import UserSerializer
                return Response({
                    "user": UserSerializer(user).data,
                    "tokens": tokens,
                    "tenant":  TenantSerializer(current_tenant).data if current_tenant else None
                }, status=status.HTTP_200_OK)

            # Debug logging for validation errors
            logger.warning(f"Login validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Login error for request from {request.META.get('REMOTE_ADDR')}: {e}")
            return handle_safe_error(
                "Internal server error during login",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                {"remote_addr": request.META.get('REMOTE_ADDR')}
            )


class RefreshTokenView(APIView):
    """
    Token refresh view with tenant validation
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            serializer = TokenRefreshSerializer(data=request.data)
            if serializer.is_valid():
                # Get the user from the token data
                token_data = serializer.validated_data["token_data"]
                refresh_token = request.data.get("refresh_token")

                # Decode the refresh token to get user info
                try:
                    import jwt
                    payload = jwt.decode(
                        refresh_token,
                        settings.JWT_SECRET_KEY,
                        algorithms=[settings.JWT_ALGORITHM]
                    )
                    user_id = payload.get("user_id")
                    token_tenant_schema = payload.get("tenant_schema")

                    # Get user for tenant validation
                    user = User.objects.get(id=user_id)

                    # Get current tenant from request
                    current_tenant = getattr(request, 'tenant', None)

                    # Verify user belongs to current tenant (same logic as LoginView)
                    if current_tenant and current_tenant.schema_name != PUBLIC_SCHEMA_NAME:
                        if not user.tenants.filter(schema_name=current_tenant.schema_name).exists():
                            return handle_safe_error(
                                "User not authorized for this tenant",
                                status.HTTP_401_UNAUTHORIZED,
                                {"tenant": current_tenant.schema_name}
                            )

                    # Verify token tenant matches current tenant
                    if current_tenant and token_tenant_schema:
                        if current_tenant.schema_name != token_tenant_schema:
                            return handle_safe_error(
                                "Token not valid for this tenant",
                                status.HTTP_401_UNAUTHORIZED,
                                {"expected": current_tenant.schema_name, "got": token_tenant_schema}
                            )

                except jwt.InvalidTokenError:
                    return handle_safe_error(
                        "Invalid refresh token",
                        status.HTTP_401_UNAUTHORIZED
                    )
                except User.DoesNotExist:
                    return handle_safe_error(
                        "User not found",
                        status.HTTP_401_UNAUTHORIZED
                    )

                return Response(token_data, status=status.HTTP_200_OK)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            return handle_safe_error(
                "Token refresh failed",
                status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    """
    User logout view
    """
    def post(self, request):
        # Create audit log
        create_audit_log(
            user=request.user,
            action="logout",
            model_name="User",
            object_id=str(request.user.id),
            request=request
        )

        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)


class ProfileView(APIView):
    """
    User profile view
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get user profile"""
        # Import here to avoid circular import
        from .serializers import UserSerializer
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        """Update user profile"""
        # Import here to avoid circular import
        from .serializers import UserSerializer
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    """
    Password change view
    """
    permission_classes = [permissions.IsAuthenticated]

    @auth_rate_limit
    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={"request": request}
        )

        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data["new_password"])
            user.save()

            # Create audit log
            create_audit_log(
                user=user,
                action="update",
                model_name="User",
                object_id=str(user.id),
                changes={"password": "changed"},
                request=request
            )

            return Response(
                {"message": "Password changed successfully"},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DashboardStatsView(APIView):
    """
    Dashboard statistics for super admin
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Only super admins can access this
        if not request.user.is_superuser:
            return handle_safe_error("Permission denied", status.HTTP_403_FORBIDDEN)

        try:
            # Get basic stats
            total_tenants = Client.objects.count()
            total_users = User.objects.count()
            active_domains = Domain.objects.filter(is_primary=True).count()

            # Get recent tenants
            recent_tenants = Client.objects.order_by('-created_on')[:5]

            # Annotate user count directly in the query for efficiency
            recent_tenants = Client.objects.annotate(
                user_count=Count('users')
            ).order_by('-created_on')[:5]

            recent_tenants_data = []
            for tenant in recent_tenants:
                domain = Domain.objects.filter(tenant=tenant).first()
                domain_name = domain.domain if domain else 'N/A'

                recent_tenants_data.append({
                    'name': tenant.name,
                    'domain': domain_name,
                    'users': tenant.user_count,  # Use the annotated count
                    'status': 'Active' if tenant.is_active else 'Inactive',
                    'created': tenant.created_on.strftime('%Y-%m-%d')
                })

            return Response({
                'total_tenants': total_tenants,
                'total_users': total_users,
                'active_domains': active_domains,
                'total_actions': 0,  # Placeholder for audit logs count
                'recent_tenants': recent_tenants_data
            })
        except Exception as e:
            logger.error(f"Dashboard stats error: {e}")
            return handle_safe_error("Dashboard stats error", status.HTTP_500_INTERNAL_SERVER_ERROR)
