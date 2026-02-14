"""Tests for reports - integrity module and report generation."""

from datetime import date

from django.test import TestCase, override_settings

from .integrity import (
    compute_content_hash,
    compute_hmac,
    compute_report_fingerprint,
    create_integrity_record,
    verify_hmac,
    verify_integrity,
)


TEST_SECRET = "test-secret-key-for-unit-tests"


class ComputeContentHashTest(TestCase):
    """Test SHA-256 content hashing."""

    def test_string_input(self):
        h = compute_content_hash("hello")
        self.assertEqual(len(h), 64)  # SHA-256 hex length

    def test_dict_input_normalized(self):
        h1 = compute_content_hash({"b": 2, "a": 1})
        h2 = compute_content_hash({"a": 1, "b": 2})
        self.assertEqual(h1, h2)

    def test_list_input(self):
        h = compute_content_hash([1, 2, 3])
        self.assertEqual(len(h), 64)

    def test_different_content_different_hash(self):
        h1 = compute_content_hash("hello")
        h2 = compute_content_hash("world")
        self.assertNotEqual(h1, h2)

    def test_deterministic(self):
        h1 = compute_content_hash({"key": "value"})
        h2 = compute_content_hash({"key": "value"})
        self.assertEqual(h1, h2)


class ComputeHmacTest(TestCase):
    """Test HMAC-SHA256 signing."""

    def test_string_input(self):
        sig = compute_hmac("hello", TEST_SECRET)
        self.assertEqual(len(sig), 64)

    def test_dict_input_normalized(self):
        sig1 = compute_hmac({"b": 2, "a": 1}, TEST_SECRET)
        sig2 = compute_hmac({"a": 1, "b": 2}, TEST_SECRET)
        self.assertEqual(sig1, sig2)

    def test_different_secrets_different_signatures(self):
        sig1 = compute_hmac("hello", "secret1")
        sig2 = compute_hmac("hello", "secret2")
        self.assertNotEqual(sig1, sig2)

    def test_deterministic(self):
        sig1 = compute_hmac("content", TEST_SECRET)
        sig2 = compute_hmac("content", TEST_SECRET)
        self.assertEqual(sig1, sig2)


class VerifyHmacTest(TestCase):
    """Test HMAC verification."""

    def test_valid_signature(self):
        sig = compute_hmac("content", TEST_SECRET)
        self.assertTrue(verify_hmac("content", sig, TEST_SECRET))

    def test_invalid_signature(self):
        self.assertFalse(verify_hmac("content", "invalid-sig", TEST_SECRET))

    def test_tampered_content(self):
        sig = compute_hmac("original", TEST_SECRET)
        self.assertFalse(verify_hmac("tampered", sig, TEST_SECRET))

    def test_wrong_secret(self):
        sig = compute_hmac("content", "correct-secret")
        self.assertFalse(verify_hmac("content", sig, "wrong-secret"))


@override_settings(SECRET_KEY=TEST_SECRET)
class CreateIntegrityRecordTest(TestCase):
    """Test integrity record creation."""

    def test_structure(self):
        record = create_integrity_record({"title": "Test Report"})
        self.assertIn("data", record)
        self.assertIn("integrity", record)
        self.assertEqual(record["data"], {"title": "Test Report"})

    def test_integrity_fields(self):
        record = create_integrity_record({"key": "value"})
        integrity = record["integrity"]
        self.assertEqual(integrity["version"], "1.0")
        self.assertEqual(integrity["algorithm"], "SHA-256")
        self.assertIn("timestamp", integrity)
        self.assertIn("content_hash", integrity)
        self.assertIn("signature", integrity)

    def test_content_hash_matches(self):
        data = {"title": "Report", "value": 42}
        record = create_integrity_record(data)
        expected_hash = compute_content_hash(data)
        self.assertEqual(record["integrity"]["content_hash"], expected_hash)


@override_settings(SECRET_KEY=TEST_SECRET)
class VerifyIntegrityTest(TestCase):
    """Test integrity verification."""

    def test_valid_record(self):
        record = create_integrity_record({"title": "Valid Report"})
        result = verify_integrity(record)
        self.assertTrue(result["valid"])
        self.assertTrue(result["hash_valid"])
        self.assertTrue(result["signature_valid"])

    def test_tampered_data(self):
        record = create_integrity_record({"title": "Original"})
        record["data"]["title"] = "Tampered"
        result = verify_integrity(record)
        self.assertFalse(result["valid"])
        self.assertFalse(result["hash_valid"])

    def test_tampered_signature(self):
        record = create_integrity_record({"title": "Report"})
        record["integrity"]["signature"] = "0" * 64
        result = verify_integrity(record)
        self.assertFalse(result["valid"])
        self.assertFalse(result["signature_valid"])

    def test_missing_data_key(self):
        result = verify_integrity({"integrity": {}})
        self.assertFalse(result["valid"])
        self.assertEqual(result["error"], "Invalid record structure")

    def test_missing_integrity_key(self):
        result = verify_integrity({"data": {}})
        self.assertFalse(result["valid"])

    def test_empty_record(self):
        result = verify_integrity({})
        self.assertFalse(result["valid"])


class ComputeReportFingerprintTest(TestCase):
    """Test report fingerprint generation."""

    def test_length(self):
        fp = compute_report_fingerprint(1, "monthly", "2025-01-01T00:00:00", "abc123")
        self.assertEqual(len(fp), 16)

    def test_deterministic(self):
        args = (1, "monthly", "2025-01-01T00:00:00", "abc123")
        self.assertEqual(
            compute_report_fingerprint(*args),
            compute_report_fingerprint(*args),
        )

    def test_different_inputs_different_fingerprints(self):
        fp1 = compute_report_fingerprint(1, "monthly", "2025-01-01T00:00:00", "abc")
        fp2 = compute_report_fingerprint(2, "monthly", "2025-01-01T00:00:00", "abc")
        self.assertNotEqual(fp1, fp2)


class ReportModelIntegrityTest(TestCase):
    """Test Report model integrity hash on save."""

    def test_integrity_hash_generated_on_save(self):
        from contracts.models import Contract

        contract = Contract.objects.create(
            name="Test Contract",
            client_org="Test Org",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
        )
        from .models import Report

        report = Report.objects.create(
            contract=contract,
            report_type="monthly",
            period_start=date(2025, 1, 1),
            period_end=date(2025, 1, 31),
            summary="Test summary",
        )
        self.assertTrue(len(report.integrity_hash) > 0)

    def test_delete_raises_validation_error(self):
        from django.core.exceptions import ValidationError

        from contracts.models import Contract

        from .models import Report

        contract = Contract.objects.create(
            name="Test Contract",
            client_org="Test Org",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
        )
        report = Report.objects.create(
            contract=contract,
            report_type="monthly",
            period_start=date(2025, 1, 1),
            period_end=date(2025, 1, 31),
            summary="Test",
        )
        with self.assertRaises(ValidationError):
            report.delete()
