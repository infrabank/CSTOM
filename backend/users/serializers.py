"""User and Role serializers."""

from rest_framework import serializers

from .models import Role, User


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role model."""

    class Meta:
        model = Role
        fields = ["id", "name", "description", "created_at"]
        read_only_fields = ["id", "created_at"]


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""

    roles = RoleSerializer(many=True, read_only=True)
    role_names = serializers.SerializerMethodField()
    primary_role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "display_name",
            "roles",
            "role_names",
            "primary_role",
            "status",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_role_names(self, obj) -> list[str]:
        return [r.name for r in obj.roles.all()]

    def get_primary_role(self, obj) -> str | None:
        return obj.primary_role


class UserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for user lists."""

    role_names = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "display_name",
            "role_names",
            "status",
            "is_active",
        ]

    def get_role_names(self, obj) -> list[str]:
        return [r.name for r in obj.roles.all()]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users."""

    password = serializers.CharField(write_only=True, min_length=8)
    role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "display_name",
            "role_ids",
        ]

    def create(self, validated_data):
        role_ids = validated_data.pop("role_ids", [])
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        if role_ids:
            roles = Role.objects.filter(pk__in=role_ids)
            user.roles.set(roles)

        return user


class UserRoleAssignSerializer(serializers.Serializer):
    """Serializer for assigning roles to a user."""

    role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
    )
