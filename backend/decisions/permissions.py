"""Permission classes for DecisionLog operations."""

from rest_framework.permissions import BasePermission


class DecisionLogPermission(BasePermission):
    """Permission rules for DecisionLog.

    - Create: PM or Engineer
    - Read: All authenticated users (customers read-only)
    - Update/Delete: PM only (but will still fail due to immutability)

    Note: DecisionLog is append-only. Even with PM permissions,
    update/delete operations will fail at the view level.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Create: PM or Engineer
        if view.action == "create":
            return request.user.is_pm() or request.user.is_engineer()

        # Update/Delete: Only PM can attempt (will fail due to immutability)
        if view.action in ("update", "partial_update", "destroy"):
            return request.user.is_pm()

        # Read: All authenticated users
        return True

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Read operations allowed for all
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        # Only PM can attempt modify/delete (will still fail due to immutability)
        return request.user.is_pm()


class IsDecisionLogCreator(BasePermission):
    """Check if user created the decision log.

    Note: Even creators cannot modify DecisionLog due to append-only policy.
    This permission is for reference/audit purposes.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if the decision was created by this user
        # (Task assignee is considered the creator for now)
        return obj.task.assignee_id == request.user.pk


class CanViewDecisionLog(BasePermission):
    """Permission to view decision logs.

    - All authenticated users can view decision logs
    - Customers have read-only access by default
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Customers can only read
        if request.user.is_customer():
            return request.method in ("GET", "HEAD", "OPTIONS")

        return True
