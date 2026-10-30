"""CLI for the first Academy workflow prototype.

Examples:
  python -m orchestrator.main create --store work/tasks.json
  python -m orchestrator.main run task-... --store work/tasks.json --repo-root .
  python -m orchestrator.main approve task-... --store work/tasks.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .state import Task, TaskStatus
from .store import TaskStore
from .workflow import CurriculumReviewWorkflow


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Learning Institute workflow runner")
    p.add_argument("command", choices=("create", "run", "approve", "status"))
    p.add_argument("task_id", nargs="?")
    p.add_argument("--store", default=".academy/tasks.json")
    p.add_argument("--repo-root", default=".")
    return p


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    store = TaskStore(args.store)
    if args.command == "create":
        task = store.save(Task(kind=CurriculumReviewWorkflow.kind))
    else:
        if not args.task_id:
            raise SystemExit("task_id is required")
        task = store.get(args.task_id)
        if args.command == "run":
            task = CurriculumReviewWorkflow().run(task, args.repo_root)
        elif args.command == "approve":
            task.transition(TaskStatus.APPROVED)
        store.save(task)
    print(json.dumps(task.to_dict(), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

