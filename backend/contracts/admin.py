"""Admin configuration for contracts app."""

from django.contrib import admin

from .models import Contract, ContractStatusHistory


class ContractStatusHistoryInline(admin.TabularInline):
    """Inline admin for contract status history."""

    model = ContractStatusHistory
    extra = 0
    readonly_fields = ["old_status", "new_status", "notes", "changed_at"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    """Admin configuration for Contract model."""

    list_display = [
        "name",
        "client_org",
        "status",
        "start_date",
        "end_date",
        "created_at",
    ]
    list_filter = [
        "status",
        "risk_pre_env",
        "risk_prior_vendor",
        "risk_docs_incomplete",
    ]
    search_fields = ["name", "client_org"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [ContractStatusHistoryInline]

    fieldsets = [
        (None, {"fields": ["name", "client_org", "status"]}),
        ("Dates & Amount", {"fields": ["start_date", "end_date", "contract_amount"]}),
        ("Scope", {"fields": ["scope_flags"]}),
        (
            "Risk Flags",
            {"fields": ["risk_pre_env", "risk_prior_vendor", "risk_docs_incomplete"]},
        ),
        ("Metadata", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]


@admin.register(ContractStatusHistory)
class ContractStatusHistoryAdmin(admin.ModelAdmin):
    """Admin configuration for ContractStatusHistory model."""

    list_display = ["contract", "old_status", "new_status", "changed_at"]
    list_filter = ["old_status", "new_status"]
    search_fields = ["contract__name"]
    readonly_fields = ["contract", "old_status", "new_status", "notes", "changed_at"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
