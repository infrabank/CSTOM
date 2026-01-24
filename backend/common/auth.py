"""JWT authentication utilities."""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView


def get_tokens_for_user(user):
    """Generate JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.primary_role
    refresh["display_name"] = user.display_name or user.username

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that includes user role and display name."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token["role"] = user.primary_role
        token["display_name"] = user.display_name or user.username
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view using our serializer with role claims."""

    serializer_class = CustomTokenObtainPairSerializer


class CustomJWTAuthentication(JWTAuthentication):
    """Custom JWT authentication with audit logging."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            user, token = result
            request.jwt_token = token
        return result
