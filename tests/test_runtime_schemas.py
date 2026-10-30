import json
import unittest
from pathlib import Path


class RuntimeSchemaTests(unittest.TestCase):
    def test_runtime_schemas_are_valid_json_schema_documents(self):
        root = Path(__file__).parents[1] / "schemas"
        for name in ("workflow-task.schema.json", "workflow-report.schema.json"):
            schema = json.loads((root / name).read_text(encoding="utf-8"))
            self.assertEqual(schema["$schema"], "https://json-schema.org/draft/2020-12/schema")
            self.assertIn("required", schema)


if __name__ == "__main__":
    unittest.main()
