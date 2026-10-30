"""Environment-only configuration helpers; secrets are never read from Git."""

from dataclasses import dataclass

from .credentials import CredentialManager


@dataclass(frozen=True)
class ProviderConfig:
    name: str
    api_key_env: str
    model: str

    def api_key(self, credentials: CredentialManager | None = None) -> str:
        manager = credentials or CredentialManager({self.api_key_env: self.api_key_env})
        return manager.resolve(self.api_key_env)


@dataclass(frozen=True)
class AcademyConfig:
    github_repository: str = "yogesh660/learning-institute"
    source_repository: str = "yogesh660/ml-model-zoo"
    github_token_env: str = "GITHUB_TOKEN"
    max_retries: int = 2

    def __post_init__(self) -> None:
        if self.source_repository == self.github_repository:
            raise ValueError("source and operations repositories must be distinct")
        if self.max_retries < 0:
            raise ValueError("max_retries must be non-negative")

    @property
    def operations_repository(self) -> str:
        return self.github_repository

    def github_token(self) -> str:
        value = os.getenv(self.github_token_env, "")
        if not value:
            raise RuntimeError(f"missing GitHub credential: {self.github_token_env}")
        return value

