"""
Application constants for validation and configuration.

Centralized constants ensure DRY principle and easy maintenance.
"""

LOADERS = frozenset(["forge", "fabric", "neoforge", "quilt"])

TEMPLATES = frozenset(
    [
        "tech",
        "magic",
        "adventure",
        "vanilla+",
        "optimization",
        "kitchen-sink",
    ]
)

MODRINTH_API_BASE = "https://api.modrinth.com/v2"
CURSEFORGE_API_BASE = "https://api.curseforge.com/v1"

DEFAULT_MOD_SLUGS = frozenset(
    [
        "jei",
        "mouse-tweaks",
        "memoryleakfix",
        "controlling",
        "betterf3",
        "packet-fixer",
    ]
)

AI_MAX_QUESTS_PER_CHAPTER = 10
AI_MAX_CHAPTERS = 5
AI_MAX_MOD_SELECTION = 100
