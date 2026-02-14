"""Tests for predictions services - risk score calculation."""

from datetime import date, timedelta
from unittest.mock import MagicMock

from django.test import TestCase

from .services import _calculate_age_days, _compute_mtbf_days, _compute_risk_score


class CalculateAgeDaysTest(TestCase):
    """Test _calculate_age_days helper."""

    def test_uses_purchase_date_when_available(self):
        eq = MagicMock()
        eq.purchase_date = date.today() - timedelta(days=100)
        eq.created_at = MagicMock()
        self.assertEqual(_calculate_age_days(eq), 100)

    def test_falls_back_to_created_at(self):
        eq = MagicMock()
        eq.purchase_date = None
        eq.created_at.date.return_value = date.today() - timedelta(days=50)
        self.assertEqual(_calculate_age_days(eq), 50)

    def test_brand_new_equipment(self):
        eq = MagicMock()
        eq.purchase_date = date.today()
        self.assertEqual(_calculate_age_days(eq), 0)


class ComputeMtbfDaysTest(TestCase):
    """Test _compute_mtbf_days helper."""

    def test_zero_failures_returns_none(self):
        self.assertIsNone(_compute_mtbf_days(0, 365))

    def test_negative_failures_returns_none(self):
        self.assertIsNone(_compute_mtbf_days(-1, 365))

    def test_single_failure(self):
        self.assertEqual(_compute_mtbf_days(1, 365), 365.0)

    def test_multiple_failures(self):
        self.assertEqual(_compute_mtbf_days(4, 100), 25.0)

    def test_rounding(self):
        # 100 / 3 = 33.333... -> 33.3
        self.assertEqual(_compute_mtbf_days(3, 100), 33.3)


class ComputeRiskScoreTest(TestCase):
    """Test _compute_risk_score composite calculation."""

    def test_zero_risk_no_failures_new_equipment(self):
        score = _compute_risk_score(
            failure_count=0, days_since_last=None, age_days=0, mtbf_days=None
        )
        self.assertEqual(score, 0.0)

    def test_max_risk_all_factors(self):
        score = _compute_risk_score(
            failure_count=10, days_since_last=1, age_days=1825, mtbf_days=1
        )
        # failure: 30, recency: 25, age: 20, mtbf: ~25 -> ~100
        self.assertGreaterEqual(score, 95.0)
        self.assertLessEqual(score, 100.0)

    def test_capped_at_100(self):
        score = _compute_risk_score(
            failure_count=20, days_since_last=1, age_days=5000, mtbf_days=0.1
        )
        self.assertLessEqual(score, 100.0)

    def test_failure_count_capped_at_10(self):
        score_10 = _compute_risk_score(10, None, 0, None)
        score_20 = _compute_risk_score(20, None, 0, None)
        self.assertEqual(score_10, score_20)

    def test_recency_tiers(self):
        """More recent failures should produce higher scores."""
        score_7d = _compute_risk_score(5, 7, 0, None)
        score_30d = _compute_risk_score(5, 30, 0, None)
        score_90d = _compute_risk_score(5, 90, 0, None)
        score_180d = _compute_risk_score(5, 180, 0, None)
        score_365d = _compute_risk_score(5, 365, 0, None)
        self.assertGreater(score_7d, score_30d)
        self.assertGreater(score_30d, score_90d)
        self.assertGreater(score_90d, score_180d)
        self.assertGreater(score_180d, score_365d)

    def test_age_component_scales_linearly(self):
        score_1yr = _compute_risk_score(0, None, 365, None)
        score_3yr = _compute_risk_score(0, None, 1095, None)
        self.assertAlmostEqual(score_1yr * 3, score_3yr, places=1)

    def test_age_capped_at_5_years(self):
        score_5yr = _compute_risk_score(0, None, 1825, None)
        score_10yr = _compute_risk_score(0, None, 3650, None)
        self.assertEqual(score_5yr, score_10yr)

    def test_mtbf_shorter_means_higher_risk(self):
        score_short = _compute_risk_score(0, None, 0, 30)
        score_long = _compute_risk_score(0, None, 0, 300)
        self.assertGreater(score_short, score_long)

    def test_mtbf_capped_at_365(self):
        score_365 = _compute_risk_score(0, None, 0, 365)
        score_730 = _compute_risk_score(0, None, 0, 730)
        self.assertEqual(score_365, score_730)

    def test_mtbf_none_contributes_zero(self):
        score = _compute_risk_score(0, None, 0, None)
        self.assertEqual(score, 0.0)

    def test_only_failure_count_component(self):
        # 5 failures out of 10 max = 50% of 30 weight = 15.0
        score = _compute_risk_score(5, None, 0, None)
        self.assertEqual(score, 15.0)

    def test_only_recency_within_7_days(self):
        # recency factor 1.0 * 25 = 25.0
        score = _compute_risk_score(0, 3, 0, None)
        self.assertEqual(score, 25.0)
