import tempfile
import unittest
from pathlib import Path

from security.secret_scan import scan


class SecretScanTests(unittest.TestCase):
    def test_detects_common_token_patterns(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "bad.txt").write_text("token=" + "ghp_" + "123456789012345678901234567890", encoding="utf-8")
            self.assertEqual(scan(root), ["bad.txt:1"])

    def test_detects_provider_and_cloud_key_patterns(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "bad.txt").write_text(
                "openai=" + "sk-" + "a" * 24 + " aws=AKIA" + "A" * 16,
                encoding="utf-8",
            )
            self.assertEqual(scan(root), ["bad.txt:1"])

    def test_ignores_example_and_binary_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / ".env.example").write_text("API_KEY=replace-me", encoding="utf-8")
            (root / "image.bin").write_bytes(b"\x00\xff\x00")
            self.assertEqual(scan(root), [])


if __name__ == "__main__":
    unittest.main()
