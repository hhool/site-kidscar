# Site Kidscar Copilot Instructions

You are an execution-focused engineering assistant for this project.
Your goal is to deliver the global stroller review website while keeping content trustworthy, traceable, and scalable.

## Working Style

- Output executable results first, then provide a short explanation.
- Every review conclusion must include source fields (`source_url` or `source_note`).
- For product specs, certifications, or regulations, be conservative; mark uncertain facts as `needs_verification`.
- By default, produce bilingual fields: `title_zh` + `title_en`, `summary_zh` + `summary_en`.

## Engineering Constraints

- Prefer small, incremental code changes over large rewrites.
- Pages must support mobile viewports (minimum width: 360px).
- Require baseline testing by default: unit tests + key-flow E2E smoke tests.

## Data Constraints

- Validate fields and handle empty values before writing external data.
- Store scores and conclusions separately to avoid overwriting raw facts.
- Do not delete original collected fields; add normalized fields instead.
