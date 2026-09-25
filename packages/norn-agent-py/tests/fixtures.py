"""Shared test helpers for the norn_agent test suite."""

import threading
from unittest.mock import MagicMock

import pytest

OriginalThread = threading.Thread

class ImmediateThread(OriginalThread):
    """Drop-in replacement for `threading.Thread` that runs synchronously.

    `NornAgent._flush` dispatches HTTP sends on a background thread so the
    SDK never blocks the caller. Tests need deterministic ordering, so this
    stand-in runs the target immediately on `start()` instead of spawning a
    real thread.
    """

    def __init__(self, target=None, args=(), kwargs=None, daemon=None):
        OriginalThread.__init__(self, target=target, args=args, kwargs=kwargs, daemon=daemon)
        self._target = target
        self._args = args
        self._kwargs = kwargs or {}

    def start(self) -> None:
        if self._target is not None:
            self._target(*self._args, **self._kwargs)

    def join(self, timeout=None) -> None:
        return None


@pytest.fixture
def synchronous_flush(monkeypatch):
    """Make `NornAgent._flush` run synchronously for deterministic tests."""
    monkeypatch.setattr("norn_agent.client.threading.Thread", ImmediateThread)


@pytest.fixture
def mock_http_send(monkeypatch):
    """Patch `HttpClient.send` so no real network calls are made.

    Returns the `Mock` so tests can inspect call arguments.
    """
    mock = MagicMock()
    monkeypatch.setattr("norn_agent.http.HttpClient.send", mock)
    return mock
