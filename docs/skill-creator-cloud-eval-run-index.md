# Skill Creator Cloud Eval Run Index

Use this file to track completed cloud-runner iterations and link to corresponding ephemeral workspace artifacts.

## Entry Template

```md
## iteration-N
- Date: YYYY-MM-DD
- Runner: <cloud-runner-id>
- Job: <job-id>
- Workspace path: ../openai-cloud-skill-creator-workspace/iteration-N
- Artifacts URL: <artifact dashboard link>
- Retrieval pointer: <fallback path / signed URL / storage key>
- Baseline score: <0-1>
- Candidate score: <0-1>
- Delta: <candidate-baseline>
- Critical regressions: <eval IDs or none>
- Required assertion failure rate: <percent>
- Decision: proceed / iterate
- Notes: <short summary>
```

## Decisions

- `proceed`: all promotion gates passed.
- `iterate`: one or more promotion gates failed; next iteration required.
