"""Audit logging coverage map.

This module documents which models and actions are covered by audit logging.
"""

# Models that trigger audit events
AUDITED_MODELS = {
    "contracts.Contract": {
        "actions": ["create", "update", "delete", "status_change"],
        "fields_tracked": ["status", "risk_flags", "scopes"],
        "related_models": ["ContractStatusHistory"],
    },
    "tasks.Task": {
        "actions": ["create", "update", "delete", "status_change"],
        "fields_tracked": ["status", "priority", "assignee"],
        "related_models": [],
    },
    "decisions.DecisionLog": {
        "actions": ["create"],  # Append-only, no update/delete
        "fields_tracked": ["decision_type", "risk_level"],
        "related_models": [],
    },
    "events.ChangeIncident": {
        "actions": ["create", "update", "delete", "link"],
        "fields_tracked": ["event_type", "severity", "related_events"],
        "related_models": [],
    },
    "reports.Report": {
        "actions": ["create", "generate"],
        "fields_tracked": ["report_type", "status"],
        "related_models": [],
    },
    "users.User": {
        "actions": ["create", "update", "status_change", "role_assign"],
        "fields_tracked": ["status", "roles"],
        "related_models": ["Role"],
    },
}

# Action types for audit events
ACTION_TYPES = {
    "create": "Record created",
    "update": "Record updated",
    "delete": "Record deleted",
    "status_change": "Status field changed",
    "role_assign": "Role assignment changed",
    "link": "Related records linked",
    "generate": "Report generated",
}


def get_coverage_report() -> dict:
    """Generate a coverage report showing audit logging status."""
    report = {
        "total_models": len(AUDITED_MODELS),
        "total_actions": sum(len(m["actions"]) for m in AUDITED_MODELS.values()),
        "models": {},
    }

    for model, config in AUDITED_MODELS.items():
        report["models"][model] = {
            "actions_covered": len(config["actions"]),
            "fields_tracked": len(config["fields_tracked"]),
            "has_related": len(config["related_models"]) > 0,
        }

    return report


def is_model_audited(model_name: str) -> bool:
    """Check if a model is configured for audit logging."""
    return model_name in AUDITED_MODELS


def get_tracked_fields(model_name: str) -> list[str]:
    """Get list of tracked fields for a model."""
    if model_name not in AUDITED_MODELS:
        return []
    return AUDITED_MODELS[model_name]["fields_tracked"]
