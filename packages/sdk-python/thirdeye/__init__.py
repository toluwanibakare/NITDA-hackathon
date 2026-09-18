"""ThirdEye SDK — guard third-party integrations with continuous trust scoring."""
from .client import ThirdEyeBlockedError, ThirdEyeClient, should_proceed
from .evaluate import action_for_level, evaluate_local, level_for_score
from .guard import guard, wrap_outbound

__all__ = [
    "ThirdEyeClient", "ThirdEyeBlockedError", "should_proceed",
    "evaluate_local", "level_for_score", "action_for_level",
    "guard", "wrap_outbound",
]
__version__ = "0.1.0"
