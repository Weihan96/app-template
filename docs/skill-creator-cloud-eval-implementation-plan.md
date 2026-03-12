# Skill Creator Cloud-Eval Implementation Plan

## Objective

Build a new OpenAI-standard skill that mirrors Anthropic's `skill-creator` workflow while executing evaluation artifacts in a Codex Cloud Runner sibling workspace and keeping the repository clean.

## Scope

This plan covers:
- skill scaffold and metadata contract,
- evaluation-run orchestration and scoring,
- cloud artifact retention strategy,
- reproducible verification and promotion gates.

This plan does **not** include implementing the full skill in this document; it defines how implementation should proceed.

## Design Principles

- Follow OpenAI skill packaging standards (`SKILL.md` + `agents/openai.yaml`).
- Keep `skills-wip/` as the source of truth for authored skill assets.
- Use an Anthropic-style sibling workspace for iterative evaluation runs.
- Keep generated artifacts in cloud runner storage, not committed source folders.
- Persist only durable evaluation summaries and runner links in repository files.
- Ensure every phase is reproducible using Bun-based commands.

## Proposed Repository Structure

### Versioned (tracked) assets

```txt
skills-wip/openai-cloud-skill-creator/
  SKILL.md
  agents/
    openai.yaml
  references/
    eval-workflow.md
    eval-schema.md
    benchmark-cases.md
  scripts/
    run_eval.mjs
    aggregate_eval.mjs
    export_summary.mjs
```

### Planning and run records

```txt
docs/
  skill-creator-cloud-eval-implementation-plan.md
  skill-creator-cloud-eval-run-index.md
```

## Cloud Runner Workspace Model

For each evaluation cycle, create a sibling workspace in the cloud container:

```txt
../openai-cloud-skill-creator-workspace/
  iteration-1/
    eval-001-onboarding-flow/
      with_skill/
        output.md
        metadata.json
      without_skill/
        output.md
        metadata.json
      timing.json
      grading.json
    eval-002-yaml-compliance/
      ...
    benchmark.json
    benchmark.md
    feedback.json
  iteration-2/
    ...
```

Notes:
- This folder is intentionally outside `skills-wip/` to preserve sibling-workspace ergonomics.
- Workspace artifacts are cloud-local and ephemeral.
- The repository stores run pointers and compact summaries only.

## Data Contract: Git vs Cloud

### Stored in Git

- Benchmark definitions and scoring schema.
- Evaluation scripts and invocation examples.
- Iteration summaries (score deltas, regressions, recommendations).
- Run-index entries with runner metadata and artifact pointers.

### Stored only in Cloud Runner workspace

- Raw model transcripts and full outputs.
- Per-case intermediate timing and grading internals.
- Temporary debug logs and replay files.

## Evaluation Workflow

1. **Prepare benchmark set**
   - Curate benchmark cases in `references/benchmark-cases.md`.
   - Encode weighted assertions in `references/eval-schema.md`.

2. **Launch paired run**
   - Execute baseline (`without_skill`) and candidate (`with_skill`) on the same benchmark inputs.
   - Write raw artifacts to `../openai-cloud-skill-creator-workspace/iteration-N/`.

3. **Grade and aggregate**
   - Generate per-case `grading.json` with assertion-level pass/fail and weighted scores.
   - Generate iteration-level `benchmark.json` and `benchmark.md`.

4. **Export durable summary to repo**
   - Produce a compact summary with aggregate metrics and notable regressions.
   - Append/update `docs/skill-creator-cloud-eval-run-index.md` with run metadata and links.

5. **Iterate and promote**
   - Apply workflow/prompt changes.
   - Re-run as `iteration-(N+1)`.
   - Promote only when promotion gates pass.

## Promotion Gates (go / no-go)

A candidate iteration is `proceed` only if all are true:
- Candidate aggregate score is `>= baseline + 0.05`.
- No critical assertion regresses.
- Failure rate for required assertions is `<= 2%`.
- Runner artifacts are accessible from the run index entry.

Otherwise mark `iterate` and include blocking regressions.

## Operational Commands (Bun)

Planned command surface (to be implemented under `skills-wip/openai-cloud-skill-creator/scripts`):

- `bun run skills:validate --profile auto --target openai-cloud-skill-creator`
- `bun run skills:deps --target openai-cloud-skill-creator`
- `bun skills-wip/openai-cloud-skill-creator/scripts/run_eval.mjs --iteration <n>`
- `bun skills-wip/openai-cloud-skill-creator/scripts/aggregate_eval.mjs --iteration <n>`
- `bun skills-wip/openai-cloud-skill-creator/scripts/export_summary.mjs --iteration <n>`

## Run Index Requirements

Each iteration entry must include:
- iteration id and date,
- cloud runner id/job id,
- workspace path,
- artifact URL or retrieval pointer,
- baseline/candidate score and delta,
- regressions and decision (`proceed` or `iterate`),
- concise notes.

## Acceptance Criteria

- New skill scaffold complies with OpenAI metadata requirements.
- Eval harness runs baseline/candidate comparisons from one command entrypoint.
- Each iteration produces benchmark summaries and explicit go/no-go decisions.
- Repo keeps reproducible definitions and run pointers only.
- Raw artifacts remain cloud-local and are not committed.

## Verification Plan

- `bun run lint`
- `bun run typecheck`
- `bun run test:e2e`

## Implementation Phases

1. **Scaffold**: Create `skills-wip/openai-cloud-skill-creator/` with metadata and references.
2. **Harness**: Add paired-run, grading, and summary-export scripts.
3. **Indexing**: Enforce run-index template and required fields.
4. **Trial run**: Execute one full cloud iteration and capture summary.
5. **Refinement**: Resolve regressions and retest until promotion gates pass.

## Risks and Mitigations

- **Risk**: Artifact links expire.
  - **Mitigation**: Store runner/job metadata and retrieval pointers with each index entry.
- **Risk**: Schema and grader drift.
  - **Mitigation**: Validate eval schema before running and fail fast on mismatch.
- **Risk**: Subjective promotion decisions.
  - **Mitigation**: Use numeric promotion gates and required-assertion thresholds.
