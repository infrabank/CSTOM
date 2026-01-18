"""Base permission classes for RBAC."""

from rest_framework.permissions import BasePermission


class IsActiveUser(BasePermission):
    """Allow access only to active users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.status == "active"
        )


class IsPM(BasePermission):
    """Allow access only to users with PM role."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_pm()


class IsEngineer(BasePermission):
    """Allow access only to users with Engineer role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_engineer()
        )


class IsAdmin(BasePermission):
    """Allow access only to users with Admin role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_admin_role()
        )


class IsCustomer(BasePermission):
    """Allow access only to users with Customer role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_customer()
        )


class IsPMOrAdmin(BasePermission):
    """Allow access to PM or Admin users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_pm() or request.user.is_admin_role())
        )


class IsPMOrEngineer(BasePermission):
    """Allow access to PM or Engineer users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_pm() or request.user.is_engineer())
        )


class ReadOnlyForCustomer(BasePermission):
    """Allow read-only access for customers, full access for others."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_customer():
            return request.method in ("GET", "HEAD", "OPTIONS")

        return True
