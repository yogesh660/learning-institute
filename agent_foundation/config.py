"""Environment-only configuration helpers; secrets are never read from Git."""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ProviderConfig:
    name: str
    api_key_env: str
    model: str

    def api_key(self) -> str:
        value = os.getenv(self.api_key_env, "")
        if not value:
            raise RuntimeError(f"missing provider credential: {self.api_key_env}")
        return value


@dataclass(frozen=True)
class AcademyConfig:
    github_repository: str = "yogesh660/learning-institute"
    github_token_env: str = "GITHUB_TOKEN"
    max_retries: int = 2

    def github_token(self) -> str:
        value = os.getenv(self.github_token_env, "")
        if not value:
            raise RuntimeError(f"missing GitHub credential: {self.github_token_env}")
        return value

