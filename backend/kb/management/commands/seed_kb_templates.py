"""Management command to seed KB categories and templates."""

from django.core.management.base import BaseCommand

from kb.models import KBCategory, KBTemplate


# fmt: off
CATEGORIES = [
    {
        "name": "Hardware",
        "description": "Hardware related issues and troubleshooting",
    },
    {
        "name": "Software",
        "description": "Software errors, configuration, and application issues",
    },
    {
        "name": "Network",
        "description": "Network connectivity, routing, and communication issues",
    },
    {
        "name": "Security",
        "description": "Security incidents, vulnerabilities, and access issues",
    },
    {
        "name": "Performance",
        "description": "Performance degradation, optimization, and capacity issues",
    },
    {
        "name": "General",
        "description": "General troubleshooting and operational procedures",
    },
]

TEMPLATES = [
    # -- Hardware Failure --
    {
        "name": "Hardware Failure Report",
        "incident_type": "hardware_failure",
        "category_name": "Hardware",
        "template_content": (
            "# Hardware Failure Report\n\n"
            "## Incident Summary\n"
            "- **Equipment**: \n"
            "- **Location**: \n"
            "- **Reported by**: \n"
            "- **Date/Time**: \n\n"
            "## Symptoms\n"
            "Describe the observed symptoms:\n"
            "1. \n"
            "2. \n\n"
            "## Root Cause\n"
            "Identified root cause of the hardware failure:\n\n"
            "## Impact\n"
            "- **Affected Systems**: \n"
            "- **Downtime Duration**: \n"
            "- **Users Affected**: \n\n"
            "## Resolution\n"
            "Steps taken to resolve:\n"
            "1. \n"
            "2. \n"
            "3. \n\n"
            "## Prevention\n"
            "Recommendations to prevent recurrence:\n"
            "- \n"
        ),
    },
    # -- Software Error --
    {
        "name": "Software Error Troubleshooting",
        "incident_type": "software_error",
        "category_name": "Software",
        "template_content": (
            "# Software Error Troubleshooting\n\n"
            "## Error Overview\n"
            "- **Application**: \n"
            "- **Environment**: (Production / Staging / Development)\n"
            "- **Error Code/Message**: \n"
            "- **First Occurrence**: \n\n"
            "## Reproduction Steps\n"
            "1. \n"
            "2. \n"
            "3. \n\n"
            "## Expected vs Actual Behavior\n"
            "- **Expected**: \n"
            "- **Actual**: \n\n"
            "## Root Cause Analysis\n"
            "Describe the identified root cause:\n\n"
            "## Fix Applied\n"
            "```\n"
            "Paste relevant code changes or configuration updates here\n"
            "```\n\n"
            "## Verification\n"
            "How the fix was verified:\n"
            "- [ ] Unit tests passed\n"
            "- [ ] Integration tests passed\n"
            "- [ ] Manual verification completed\n\n"
            "## Related Artifacts\n"
            "- Ticket/Issue: \n"
            "- PR/Commit: \n"
        ),
    },
    # -- Network Issue --
    {
        "name": "Network Issue Diagnosis",
        "incident_type": "network_issue",
        "category_name": "Network",
        "template_content": (
            "# Network Issue Diagnosis\n\n"
            "## Incident Details\n"
            "- **Affected Network Segment**: \n"
            "- **Severity**: (Critical / High / Medium / Low)\n"
            "- **Start Time**: \n"
            "- **Resolution Time**: \n\n"
            "## Symptoms\n"
            "- [ ] Complete connectivity loss\n"
            "- [ ] Intermittent connectivity\n"
            "- [ ] High latency\n"
            "- [ ] Packet loss\n"
            "- [ ] DNS resolution failure\n"
            "- [ ] Other: \n\n"
            "## Diagnostic Steps\n"
            "1. \n"
            "2. \n"
            "3. \n\n"
            "## Findings\n"
            "Describe diagnostic results:\n\n"
            "## Resolution\n"
            "Steps taken to restore connectivity:\n"
            "1. \n"
            "2. \n\n"
            "## Monitoring\n"
            "Post-resolution monitoring actions:\n"
            "- \n"
        ),
    },
    # -- Security Incident --
    {
        "name": "Security Incident Response",
        "incident_type": "security_incident",
        "category_name": "Security",
        "template_content": (
            "# Security Incident Response\n\n"
            "## Classification\n"
            "- **Severity**: (Critical / High / Medium / Low)\n"
            "- **Type**: (Unauthorized Access / Malware / Data Breach / Phishing / Other)\n"
            "- **Detection Method**: \n"
            "- **Date Detected**: \n\n"
            "## Scope of Impact\n"
            "- **Affected Systems**: \n"
            "- **Affected Data**: \n"
            "- **Affected Users**: \n\n"
            "## Containment Actions\n"
            "Immediate actions taken to contain the incident:\n"
            "1. \n"
            "2. \n\n"
            "## Investigation\n"
            "Findings from the investigation:\n\n"
            "## Eradication & Recovery\n"
            "Steps taken to remove the threat and restore operations:\n"
            "1. \n"
            "2. \n\n"
            "## Lessons Learned\n"
            "- What went well: \n"
            "- What could be improved: \n"
            "- Action items: \n"
        ),
    },
    # -- Performance Degradation --
    {
        "name": "Performance Degradation Analysis",
        "incident_type": "performance_degradation",
        "category_name": "Performance",
        "template_content": (
            "# Performance Degradation Analysis\n\n"
            "## Overview\n"
            "- **System/Service**: \n"
            "- **Metric Affected**: (Response Time / Throughput / CPU / Memory / Disk I/O)\n"
            "- **Baseline Value**: \n"
            "- **Degraded Value**: \n"
            "- **Duration**: \n\n"
            "## Timeline\n"
            "| Time | Event |\n"
            "| --- | --- |\n"
            "| | Issue detected |\n"
            "| | Investigation started |\n"
            "| | Root cause identified |\n"
            "| | Fix applied |\n"
            "| | Performance restored |\n\n"
            "## Root Cause\n"
            "Identified cause of performance degradation:\n\n"
            "## Optimization Applied\n"
            "Changes made to restore performance:\n"
            "1. \n"
            "2. \n\n"
            "## Results\n"
            "Performance metrics after optimization:\n"
            "- Before: \n"
            "- After: \n\n"
            "## Monitoring Updates\n"
            "New alerts or thresholds configured:\n"
            "- \n"
        ),
    },
    # -- General / Other --
    {
        "name": "General Troubleshooting Guide",
        "incident_type": "other",
        "category_name": "General",
        "template_content": (
            "# General Troubleshooting Guide\n\n"
            "## Problem Description\n"
            "Clearly describe the issue:\n\n"
            "## Environment\n"
            "- **System/Service**: \n"
            "- **Version**: \n"
            "- **Configuration**: \n\n"
            "## Steps to Reproduce\n"
            "1. \n"
            "2. \n"
            "3. \n\n"
            "## Investigation\n"
            "Diagnostic steps performed:\n"
            "1. \n"
            "2. \n\n"
            "## Solution\n"
            "Resolution steps:\n"
            "1. \n"
            "2. \n\n"
            "## Notes\n"
            "Additional context or references:\n"
            "- \n"
        ),
    },
    {
        "name": "Standard Operating Procedure",
        "incident_type": "other",
        "category_name": "General",
        "template_content": (
            "# Standard Operating Procedure\n\n"
            "## Purpose\n"
            "Describe the purpose of this procedure:\n\n"
            "## Scope\n"
            "Who and what this procedure applies to:\n\n"
            "## Prerequisites\n"
            "- \n"
            "- \n\n"
            "## Procedure\n"
            "### Step 1: \n"
            "Description:\n\n"
            "### Step 2: \n"
            "Description:\n\n"
            "### Step 3: \n"
            "Description:\n\n"
            "## Verification\n"
            "How to verify the procedure was completed successfully:\n"
            "- [ ] \n"
            "- [ ] \n\n"
            "## Rollback Plan\n"
            "Steps to revert if something goes wrong:\n"
            "1. \n"
            "2. \n\n"
            "## References\n"
            "- \n"
        ),
    },
]
# fmt: on


class Command(BaseCommand):
    """Seed KB categories and templates."""

    help = "Create initial KB categories and templates"

    def handle(self, *args, **options):
        # Seed categories first
        cat_map = {}
        for cat_data in CATEGORIES:
            cat, created = KBCategory.objects.get_or_create(
                name=cat_data["name"],
                defaults={"description": cat_data["description"]},
            )
            cat_map[cat_data["name"]] = cat
            status = "Created" if created else "Already exists"
            self.stdout.write(f"  Category: {cat_data['name']} - {status}")

        self.stdout.write("")

        # Seed templates
        created_count = 0
        for tmpl_data in TEMPLATES:
            category = cat_map.get(tmpl_data["category_name"])
            _, created = KBTemplate.objects.get_or_create(
                name=tmpl_data["name"],
                defaults={
                    "incident_type": tmpl_data["incident_type"],
                    "category": category,
                    "template_content": tmpl_data["template_content"],
                },
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"  Created template: {tmpl_data['name']}")
                )
            else:
                self.stdout.write(f"  Template already exists: {tmpl_data['name']}")

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. {created_count} new template(s), "
                f"{len(TEMPLATES) - created_count} already existed."
            )
        )
