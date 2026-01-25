"""Knowledge Base serializers."""

from rest_framework import serializers

from .models import KBArticle, KBCategory, KBTemplate


class KBCategorySerializer(serializers.ModelSerializer):
    """Serializer for KBCategory model."""

    class Meta:
        model = KBCategory
        fields = [
            "id",
            "name",
            "description",
            "parent",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class KBArticleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for article lists."""

    category_name = serializers.CharField(source="category.name", read_only=True)
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)

    class Meta:
        model = KBArticle
        fields = [
            "id",
            "title",
            "category",
            "category_name",
            "author",
            "author_name",
            "tags",
            "view_count",
            "helpful_count",
            "is_published",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "view_count",
            "helpful_count",
            "created_at",
            "updated_at",
        ]


class KBArticleDetailSerializer(serializers.ModelSerializer):
    """Full serializer for article detail."""

    category_name = serializers.CharField(source="category.name", read_only=True)
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)

    class Meta:
        model = KBArticle
        fields = [
            "id",
            "title",
            "content",
            "category",
            "category_name",
            "author",
            "author_name",
            "tags",
            "view_count",
            "helpful_count",
            "is_published",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "view_count",
            "helpful_count",
            "created_at",
            "updated_at",
        ]


class KBArticleCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating articles."""

    class Meta:
        model = KBArticle
        fields = [
            "title",
            "content",
            "category",
            "tags",
            "is_published",
        ]


class KBTemplateSerializer(serializers.ModelSerializer):
    """Serializer for KBTemplate model."""

    category_name = serializers.CharField(source="category.name", read_only=True)
    incident_type_display = serializers.CharField(
        source="get_incident_type_display", read_only=True
    )

    class Meta:
        model = KBTemplate
        fields = [
            "id",
            "name",
            "category",
            "category_name",
            "template_content",
            "incident_type",
            "incident_type_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
