"""Norn Agent Observe (Norn) SDK for AI agent observability.

>>> from norn_agent import NornAgent
>>> norn = NornAgent(api_key="pk_live_...")
>>> run = norn.start_run("My Task")
>>> span = run.start_span("llm_call", model="gpt-4o", input_preview="What is 2+2?")
>>> span.end(output_preview="4", input_tokens=12, output_tokens=1, status="success")
>>> run.complete(status="completed")
"""

from . import constants
from .client import NornAgent
from .run import AgentRun
from .span import AgentSpan
from .types import AgentSpanPayload, StartSpanOpts

__version__ = "0.1.0"

__all__ = [
    "NornAgent",
    "AgentRun",
    "AgentSpan",
    "AgentSpanPayload",
    "StartSpanOpts",
    "constants",
    "__version__",
]
