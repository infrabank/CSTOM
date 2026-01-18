"""Report integrity hashing helpers.

This module provides utilities for ensuring report data integrity
through cryptographic hashing.
"""

import hashlib
import hmac
import json
from datetime import datetime
from typing import Any


# Default secret key (should be overridden from settings in production)
DEFAULT_SECRET = "cstom-report-integrity-key"


def compute_content_hash(content: str | dict | list) -> str:
    """Compute SHA-256 hash of content.

    Args:
        content: String, dict, or list to hash

    Returns:
        Hex-encoded SHA-256 hash
    """
    if isinstance(content, (dict, list)):
        # Normalize JSON for consistent hashing
        content = json.dumps(content, sort_keys=True, separators=(",", ":"))

    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def compute_hmac(content: str | dict | list, secret: str | None = None) -> str:
    """Compute HMAC-SHA256 for content verification.

    Args:
        content: Content to sign
        secret: Secret key (defaults to DEFAULT_SECRET)

    Returns:
        Hex-encoded HMAC-SHA256 signature
    """
    if secret is None:
        secret = DEFAULT_SECRET

    if isinstance(content, (dict, list)):
        content = json.dumps(content, sort_keys=True, separators=(",", ":"))

    return hmac.new(
        secret.encode("utf-8"), content.encode("utf-8"), hashlib.sha256
    ).hexdigest()


def verify_hmac(
    content: str | dict | list, signature: str, secret: str | None = None
) -> bool:
    """Verify HMAC signature for content.

    Args:
        content: Content to verify
        signature: Expected HMAC signature
        secret: Secret key used for signing

    Returns:
        True if signature is valid
    """
    expected = compute_hmac(content, secret)
    return hmac.compare_digest(expected, signature)


def create_integrity_record(report_data: dict[str, Any]) -> dict[str, Any]:
    """Create an integrity record for a report.

    Args:
        report_data: The report data to protect

    Returns:
        Dict containing original data plus integrity metadata
    """
    timestamp = datetime.utcnow().isoformat()
    content_hash = compute_content_hash(report_data)

    integrity_data = {
        "version": "1.0",
        "timestamp": timestamp,
        "content_hash": content_hash,
        "algorithm": "SHA-256",
    }

    # Sign the integrity metadata
    integrity_data["signature"] = compute_hmac(
        {"content_hash": content_hash, "timestamp": timestamp}
    )

    return {
        "data": report_data,
        "integrity": integrity_data,
    }


def verify_integrity(
    record: dict[str, Any], secret: str | None = None
) -> dict[str, bool | str]:
    """Verify the integrity of a report record.

    Args:
        record: Record with data and integrity sections
        secret: Secret key for HMAC verification

    Returns:
        Dict with verification results
    """
    if "data" not in record or "integrity" not in record:
        return {
            "valid": False,
            "error": "Invalid record structure",
        }

    integrity = record["integrity"]
    data = record["data"]

    # Verify content hash
    computed_hash = compute_content_hash(data)
    hash_valid = computed_hash == integrity.get("content_hash")

    # Verify signature
    signature_data = {
        "content_hash": integrity.get("content_hash"),
        "timestamp": integrity.get("timestamp"),
    }
    signature_valid = verify_hmac(
        signature_data, integrity.get("signature", ""), secret
    )

    return {
        "valid": hash_valid and signature_valid,
        "hash_valid": hash_valid,
        "signature_valid": signature_valid,
        "algorithm": integrity.get("algorithm"),
        "timestamp": integrity.get("timestamp"),
    }


def compute_report_fingerprint(
    report_id: int, report_type: str, generated_at: str, content_hash: str
) -> str:
    """Compute a unique fingerprint for a report.

    This can be used for quick report identification and comparison.

    Args:
        report_id: Database ID of the report
        report_type: Type of report (monthly, incident, audit)
        generated_at: Generation timestamp
        content_hash: Hash of report content

    Returns:
        Short fingerprint string
    """
    data = f"{report_id}:{report_type}:{generated_at}:{content_hash}"
    full_hash = hashlib.sha256(data.encode()).hexdigest()
    # Return first 16 chars for readability
    return full_hash[:16]
