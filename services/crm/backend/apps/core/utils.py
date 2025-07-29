import threading
from collections import defaultdict
from datetime import datetime, timedelta
from functools import wraps

from rest_framework import status
from rest_framework.response import Response

from apps.tenant_core.models import AuditLog

# Constants
HTTP_X_FORWARDED_FOR = 'HTTP_X_FORWARDED_FOR'
REMOTE_ADDR = 'REMOTE_ADDR'
HTTP_USER_AGENT = 'HTTP_USER_AGENT'

# Thread-safe storage for rate limiting (in production, use Redis)
rate_limit_storage = defaultdict(list)
storage_lock = threading.Lock()


def get_client_ip(request):
    """
    Get client IP address from request.
    
    Args:
        request: Django HTTP request object
        
    Returns:
        str: Client IP address
    """
    x_forwarded_for = request.META.get(HTTP_X_FORWARDED_FOR)
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get(REMOTE_ADDR)
    return ip


def create_audit_log(user, action, model_name, object_id, changes=None, request=None):
    """
    Create audit log entry for tracking user actions.
    
    Args:
        user: User instance who performed the action
        action (str): Action performed (e.g., 'create', 'update', 'delete')
        model_name (str): Name of the model being acted upon
        object_id (str): ID of the object being acted upon
        changes (dict, optional): Dictionary of changes made
        request (HttpRequest, optional): HTTP request object for IP and user agent
        
    Returns:
        AuditLog: Created audit log instance
    """
    audit_data = {
        "user": user,
        "action": action,
        "model_name": model_name,
        "object_id": object_id,
        "changes": changes or {},
    }

    if request:
        audit_data["ip_address"] = get_client_ip(request)
        audit_data["user_agent"] = request.META.get(HTTP_USER_AGENT, '')

    return AuditLog.objects.create(**audit_data)


def rate_limit(max_requests=5, window_minutes=1, key_func=None):
    """Simple rate limiting decorator"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self_or_request, *args, **kwargs):
            # Handle both class-based and function-based views
            if hasattr(self_or_request, 'META'):
                # Function-based view - first arg is request
                request = self_or_request
                view_args = args
                view_kwargs = kwargs
            else:
                # Class-based view - first arg is self, second is request
                request = args[0] if args else kwargs.get('request')
                if not request:
                    return view_func(self_or_request, *args, **kwargs)
                view_args = args
                view_kwargs = kwargs

            # Generate rate limit key
            if key_func:
                key = key_func(request)
            else:
                key = request.META.get('REMOTE_ADDR', 'unknown')

            current_time = datetime.now()
            window_start = current_time - timedelta(minutes=window_minutes)

            with storage_lock:
                # Clean old entries
                rate_limit_storage[key] = [
                    timestamp for timestamp in rate_limit_storage[key]
                    if timestamp > window_start
                ]

                # Check if rate limit exceeded
                if len(rate_limit_storage[key]) >= max_requests:
                    return Response({
                        'error': 'Rate limit exceeded',
                        'detail': f'Maximum {max_requests} requests per {window_minutes} minute(s)'
                    }, status=status.HTTP_429_TOO_MANY_REQUESTS)

                # Add current request
                rate_limit_storage[key].append(current_time)

            return view_func(self_or_request, *view_args, **view_kwargs)
        return wrapper
    return decorator


def get_user_key(request):
    """Generate rate limit key based on user"""
    if request.user.is_authenticated:
        return f"user:{request.user.id}"
    return request.META.get('REMOTE_ADDR', 'unknown')


def get_ip_key(request):
    """Generate rate limit key based on IP"""
    return request.META.get('REMOTE_ADDR', 'unknown')


# Specific rate limiting decorators for different operations
auth_rate_limit = rate_limit(max_requests=5, window_minutes=1, key_func=get_ip_key)
user_management_rate_limit = rate_limit(max_requests=10, window_minutes=1, key_func=get_user_key)
role_management_rate_limit = rate_limit(max_requests=5, window_minutes=1, key_func=get_user_key)
