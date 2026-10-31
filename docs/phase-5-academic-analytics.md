# Phase 5: academic analytics

Phase 5 begins with backend evidence analytics only. It aggregates approved
source-review and QA evidence into a privacy-safe summary. It does not
read student records, browser `localStorage`, assessment answers, or provider
telemetry.

The public curriculum remains in `yogesh660/ml-model-zoo`; analytics must use
review evidence and pinned source revisions rather than a local content mirror.

Student learning analytics require the Phase 4 backend, consent, retention,
access-control, and data-minimisation decisions first. The agent now includes
an offline `aggregate_student_events` helper for synthetic or already-approved
pseudonymous events; it suppresses detailed counts below a configurable
minimum cohort and never returns student subjects. It is not a production
student database or ingestion endpoint. For sufficiently large cohorts it also
emits generic lesson-level completion-gap recommendations, never individual
learner recommendations, and reports aggregate lesson completion rates.

