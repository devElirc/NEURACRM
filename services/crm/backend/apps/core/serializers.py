from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .authentication import JWTTokenGenerator
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Basic user serializer for auth and profile operations
    """
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "phone", "is_active", "is_superadmin", "full_name",
            "created_at", "updated_at"
        ]
        extra_kwargs = {
            "is_superadmin": {"read_only": True},
            "username": {"read_only": True},
        }


class LoginSerializer(serializers.Serializer):
    """
    Login serializer
    """
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        """Validate user credentials"""
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid credentials")

            if not user.is_active:
                raise serializers.ValidationError("User account is disabled")

            attrs["user"] = user
            return attrs

        raise serializers.ValidationError("Must include email and password")


class TokenRefreshSerializer(serializers.Serializer):
    """
    Token refresh serializer
    """
    refresh_token = serializers.CharField()

    def validate(self, attrs):
        """Validate refresh token"""
        refresh_token = attrs.get("refresh_token")

        try:
            token_data = JWTTokenGenerator.refresh_access_token(refresh_token)
            attrs["token_data"] = token_data
            return attrs
        except Exception as e:
            raise serializers.ValidationError(str(e))


class PasswordChangeSerializer(serializers.Serializer):
    """
    Password change serializer
    """
    current_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    confirm_password = serializers.CharField()

    def validate(self, attrs):
        """Validate password change"""
        if attrs.get("new_password") != attrs.get("confirm_password"):
            raise serializers.ValidationError("New passwords do not match")
        return attrs

    def validate_current_password(self, value):
        """Validate current password"""
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value
