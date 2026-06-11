"""User and Role API views."""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from common.errors import ResourceNotFoundError
from common.permissions import IsAdmin, IsPMOrAdmin

from .models import Role, User
from .serializers import (
    RoleSerializer,
    UserCreateSerializer,
    UserListSerializer,
    UserRoleAssignSerializer,
    UserSerializer,
)


class RoleViewSet(ReadOnlyModelViewSet):
    """ViewSet for Role operations (read-only)."""

    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsPMOrAdmin]


class UserViewSet(ModelViewSet):
    """ViewSet for User operations."""

    queryset = User.objects.prefetch_related("roles").all()
    serializer_class = UserSerializer

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in [
            "create",
            "destroy",
            "assign_role",
            "update",
            "partial_update",
        ]:
            return [IsAdmin()]
        return [IsPMOrAdmin()]

    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == "list":
            return UserListSerializer
        if self.action == "create":
            return UserCreateSerializer
        if self.action == "assign_role":
            return UserRoleAssignSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        """Create a new user."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        output_serializer = UserSerializer(user)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="roles")
    def assign_role(self, request, pk=None):
        """Assign roles to a user."""
        user = self.get_object()
        serializer = UserRoleAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        role_ids = serializer.validated_data["role_ids"]

        # Validate role IDs exist
        roles = Role.objects.filter(pk__in=role_ids)
        if len(roles) != len(role_ids):
            found_ids = set(r.pk for r in roles)
            missing = set(role_ids) - found_ids
            raise ResourceNotFoundError(f"Roles not found: {missing}")

        user.roles.set(roles)
        user.save()

        output_serializer = UserSerializer(user)
        return Response(output_serializer.data)
