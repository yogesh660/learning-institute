# Curriculum proposal QA

This checklist applies to every proposed change to `yogesh660/ml-model-zoo`.
It prevents a lesson from passing syntax/build checks while missing the quality
expected by the closest existing model page.

## Required evidence

- Source files and commit SHA inspected from the remote repository.
- Closest comparable page identified (model page first; concept page only when
  the lesson is genuinely conceptual).
- Section comparison recorded: metadata, idea, steps, architecture, walkthrough,
  lab, maths, tuning, use/limitations, code, results, quiz, and related links.
- Every missing section has a disposition: implemented, intentionally not
  applicable, or follow-up issue.
- Code is runnable or explicitly labelled as pseudocode; placeholder functions
  are not acceptable in runnable examples.
- Architecture/interaction claims have visual or structural QA evidence when the
  source page supports diagrams, explainers, or labs.
- Research claims include primary sources and distinguish reported results from
  agent interpretation.
- Generated source-repository checks pass; no direct edits to its `main` branch.

## Stop conditions

Do not open a proposal when unresolved:

- broken links, invalid lesson schema, or generated-page failures;
- misleading metadata such as incorrect model/concept relationships;
- `[object Object]`, placeholder text, or undefined code in a visible section;
- benchmark or “alternative to LLM” claims without evidence and limitations;
- missing human review for material curriculum or architecture changes.

## Backend evidence shape

Proposal reports should contain `source_repository`, `source_revision`,
`comparison_target`, `section_matrix`, `architecture_review`, `code_review`,
`research_sources`, `qa_status`, and `human_review_required`.
