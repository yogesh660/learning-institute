"""CLI for the first Academy workflow prototype.

Examples:
  python -m orchestrator.main create --store work/tasks.json
  python -m orchestrator.main run task-... --store work/tasks.json --repo-root .
  python -m orchestrator.main approve task-... --store work/tasks.json
  python -m orchestrator.main run task-... --output reports/task-review.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .state import Task, TaskStatus
from .store import TaskStore
from .workflow import CurriculumReviewWorkflow
from .health import collect_health
from .service import AcademyService
from security.auth import Identity, Role


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Learning Institute workflow runner")
    p.add_argument("command", choices=("create", "run", "approve", "complete", "status", "health"))
    p.add_argument("task_id", nargs="?")
    p.add_argument("--store", default=".academy/tasks.json")
    p.add_argument("--repo-root", default=".")
    p.add_argument("--output", help="optional UTF-8 JSON workflow report")
    p.add_argument("--subject", help="authenticated identity subject")
    p.add_argument("--role", choices=[role.value for role in Role], help="authenticated identity role")
    return p


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    store = TaskStore(args.store)
    if args.command == "health":
        rendered = json.dumps(collect_health().to_dict(), indent=2)
        if args.output:
            output = Path(args.output)
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(rendered + "\n", encoding="utf-8")
        print(rendered)
        return 0
    if not args.subject or not args.role:
        raise SystemExit("--subject and --role are required for task operations")
    identity = Identity(args.subject, Role(args.role))
    service = AcademyService(store)
    if args.command == "create":
        task = service.create_curriculum_review(identity)
    else:
        if not args.task_id:
            raise SystemExit("task_id is required")
        task = store.get(args.task_id)
        if args.command == "run":
            task = service.run_curriculum_review(identity, task.id, args.repo_root)
        elif args.command == "approve":
            task = service.approve(identity, task.id)
        elif args.command == "complete":
            task = service.complete(identity, task.id)
    rendered = json.dumps(task.to_dict(), indent=2)
    if args.output:
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered + "\n", encoding="utf-8")
    print(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

