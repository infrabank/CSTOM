"""SOP document serializers."""

from rest_framework import serializers

from .models import SOPCategory, SOPDocument, SOPVersion


class SOPCategorySerializer(serializers.ModelSerializer):
    """Serializer for SOPCategory model."""

    class Meta:
        model = SOPCategory
        fields = [
            "id",
            "name",
            "description",
            "parent",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SOPVersionSerializer(serializers.ModelSerializer):
    """Serializer for SOPVersion model."""

    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )

    class Meta:
        model = SOPVersion
        fields = [
            "id",
            "document",
            "version_number",
            "content",
            "created_by",
            "created_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "version_number", "created_at"]


class SOPDocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for document lists."""

    category_name = serializers.CharField(source="category.name", read_only=True)
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    current_version_number = serializers.IntegerField(
        source="current_version.version_number", read_only=True
    )

    class Meta:
        model = SOPDocument
        fields = [
            "id",
            "title",
            "category",
            "category_name",
            "author",
            "author_name",
            "current_version_number",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SOPDocumentDetailSerializer(serializers.ModelSerializer):
    """Full serializer for document detail with version history."""

    category_name = serializers.CharField(source="category.name", read_only=True)
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    versions = SOPVersionSerializer(many=True, read_only=True)
    current_version = SOPVersionSerializer(read_only=True)

    class Meta:
        model = SOPDocument
        fields = [
            "id",
            "title",
            "category",
            "category_name",
            "author",
            "author_name",
            "current_version",
            "versions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SOPDocumentCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating documents."""

    class Meta:
        model = SOPDocument
        fields = [
            "title",
            "category",
        ]
