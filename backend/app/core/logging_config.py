import logging
import logging.config
from typing import Any, Dict

from app.core.config import settings


def setup_logging() -> None:
    """Configure application-wide logging."""
    level = logging.DEBUG if settings.debug else logging.INFO

    logging_config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "standard",
                "level": level,
            },
        },
        "loggers": {
            "uvicorn": {"handlers": ["console"], "level": level, "propagate": False},
            "app": {"handlers": ["console"], "level": level, "propagate": False},
        },
    }

    logging.config.dictConfig(logging_config)
