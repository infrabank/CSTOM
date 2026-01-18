"""RBAC policy matrix for CSTOM.

This module defines the role-based access control policies
as a centralized reference.
"""

from typing import TypedDict


class PolicyRule(TypedDict):
    """Type definition for a policy rule."""

    create: bool
    read: bool
    update: bool
    delete: bool


# Role definitions with priority (higher = more privileged)
ROLE_PRIORITY = {
    "admin": 100,
    "pm": 80,
    "engineer": 50,
    "customer": 10,
}

# Resource policies by role
# True = allowed, False = denied
POLICIES: dict[str, dict[str, PolicyRule]] = {
    "admin": {
        "users": {"create": True, "read": True, "update": True, "delete": True},
        "roles": {"create": True, "read": True, "update": True, "delete": True},
        "contracts": {"create": True, "read": True, "update": True, "delete": True},
        "tasks": {"create": True, "read": True, "update": True, "delete": True},
        "decisions": {"create": True, "read": True, "update": False, "delete": False},
        "events": {"create": True, "read": True, "update": True, "delete": True},
        "reports": {"create": True, "read": True, "update": True, "delete": True},
    },
    "pm": {
        "users": {"create": False, "read": True, "update": True, "delete": False},
        "roles": {"create": False, "read": True, "update": False, "delete": False},
        "contracts": {"create": True, "read": True, "update": True, "delete": True},
        "tasks": {"create": True, "read": True, "update": True, "delete": True},
        "decisions": {"create": True, "read": True, "update": False, "delete": False},
        "events": {"create": True, "read": True, "update": True, "delete": True},
        "reports": {"create": True, "read": True, "update": True, "delete": True},
    },
    "engineer": {
        "users": {"create": False, "read": False, "update": False, "delete": False},
        "roles": {"create": False, "read": False, "update": False, "delete": False},
        "contracts": {"create": False, "read": True, "update": False, "delete": False},
        "tasks": {"create": True, "read": True, "update": True, "delete": False},
        "decisions": {"create": True, "read": True, "update": False, "delete": False},
        "events": {"create": True, "read": True, "update": True, "delete": False},
        "reports": {"create": False, "read": True, "update": False, "delete": False},
    },
    "customer": {
        "users": {"create": False, "read": False, "update": False, "delete": False},
        "roles": {"create": False, "read": False, "update": False, "delete": False},
        "contracts": {"create": False, "read": True, "update": False, "delete": False},
        "tasks": {"create": False, "read": True, "update": False, "delete": False},
        "decisions": {"create": False, "read": True, "update": False, "delete": False},
        "events": {"create": False, "read": True, "update": False, "delete": False},
        "reports": {"create": False, "read": True, "update": False, "delete": False},
    },
}

# Special rules that override standard CRUD
SPECIAL_RULES = {
    "decisions": {
        "append_only": True,
        "note": "DecisionLog records are immutable after creation",
    },
    "contracts.status": {
        "pm_only": True,
        "note": "Only PM can change contract status",
    },
    "users.role_assign": {
        "admin_or_pm": True,
        "note": "PM can assign roles except admin role",
    },
}


def can_access(role: str, resource: str, action: str) -> bool:
    """Check if a role can perform an action on a resource."""
    if role not in POLICIES:
        return False
    if resource not in POLICIES[role]:
        return False
    return POLICIES[role][resource].get(action, False)


def get_role_priority(role: str) -> int:
    """Get the priority level for a role."""
    return ROLE_PRIORITY.get(role, 0)


def get_allowed_resources(role: str) -> list[str]:
    """Get list of resources a role can access (read)."""
    if role not in POLICIES:
        return []
    return [r for r, perms in POLICIES[role].items() if perms.get("read")]


def get_policy_matrix() -> dict:
    """Get the full policy matrix for documentation/export."""
    return {
        "roles": list(POLICIES.keys()),
        "resources": list(POLICIES.get("admin", {}).keys()),
        "policies": POLICIES,
        "special_rules": SPECIAL_RULES,
        "priority": ROLE_PRIORITY,
    }
