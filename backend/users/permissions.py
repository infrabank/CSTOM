"""Role-based permissions for user management."""

from rest_framework.permissions import BasePermission


class CanManageUsers(BasePermission):
    """Permission to manage users based on role hierarchy.

    - Admin: Can manage all users
    - PM: Can view users, assign roles (except admin)
    - Others: Cannot manage users
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Read operations allowed for PM and Admin
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return request.user.is_pm() or request.user.is_admin_role()

        # Write operations only for Admin
        return request.user.is_admin_role()


class CanAssignRoles(BasePermission):
    """Permission to assign roles to users.

    - Admin: Can assign any role
    - PM: Can assign engineer/customer roles only
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        return request.user.is_pm() or request.user.is_admin_role()

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admin can assign any role
        if request.user.is_admin_role():
            return True

        # PM can assign roles except to admins
        if request.user.is_pm():
            # Cannot modify admin users
            if obj.is_admin_role():
                return False
            return True

        return False


class IsAdminOrSelf(BasePermission):
    """Allow admins to access any user, or users to access themselves."""

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admin can access any user
        if request.user.is_admin_role():
            return True

        # Users can view their own profile
        return obj.pk == request.user.pk


class RoleHierarchyPermission(BasePermission):
    """Enforce role hierarchy in user operations.

    Role priority: admin > pm > engineer > customer
    Users cannot modify users with higher or equal priority.
    """

    ROLE_PRIORITY = {
        "admin": 4,
        "pm": 3,
        "engineer": 2,
        "customer": 1,
    }

    def _get_priority(self, user) -> int:
        """Get the highest priority role for a user."""
        max_priority = 0
        for role in user.roles.all():
            priority = self.ROLE_PRIORITY.get(role.name, 0)
            max_priority = max(max_priority, priority)
        return max_priority

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Read operations always allowed if base permission passed
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        # Users cannot modify themselves through this permission
        if obj.pk == request.user.pk:
            return False

        requester_priority = self._get_priority(request.user)
        target_priority = self._get_priority(obj)

        # Can only modify users with strictly lower priority
        return requester_priority > target_priority
