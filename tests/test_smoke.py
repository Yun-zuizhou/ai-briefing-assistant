from pathlib import Path

from tests import test_intent_recognition as intent_benchmark


def test_generate_test_data_returns_expected_count_and_shape():
    rows = intent_benchmark.generate_test_data(5)

    assert len(rows) == 5
    for index, row in enumerate(rows, start=1):
        assert row["id"] == index
        assert isinstance(row["text"], str)
        assert row["text"]
        assert row["expected"] in intent_benchmark.INTENT_TEMPLATES


def test_requirements_include_pytest_dependency():
    requirements = Path("requirements.txt").read_text(encoding="utf-8")

    assert "pytest>=" in requirements
