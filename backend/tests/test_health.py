"""Basic sanity tests."""

import pytest


def test_python_version():
    """Test that Python is at least version 3.11."""
    import sys

    assert sys.version_info >= (3, 11)


def test_imports():
    """Test that core dependencies can be imported."""
    import fastapi

    assert fastapi is not None


@pytest.mark.skipif(True, reason="Requires database and full dependencies")
def test_app_startup():
    """Test that the app can be imported (requires full dependencies)."""
    from app.main import app

    assert app is not None
