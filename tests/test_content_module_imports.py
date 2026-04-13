from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]


def test_content_modules_can_import_in_fresh_interpreter():
    code = """
import importlib
import conftest

for name in (
    'app.services.content_processing',
    'app.services.content_projection',
    'app.api.v1.content',
):
    importlib.import_module(name)
print('ok')
"""

    result = subprocess.run(
        [sys.executable, "-c", code],
        cwd=ROOT_DIR,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, (
        f"returncode={result.returncode}\nstdout={result.stdout}\nstderr={result.stderr}"
    )
    assert "ok" in result.stdout
