# site-kidscar Execution Workflow (Plugin-Based)

## 0. Current Plugin Baseline

- project-planning
- project-documenter
- frontend-web-dev
- testing-automation
- security-best-practices
- doublecheck
- context-engineering
- technical-spike

## 1. Phase 1 (Site Foundation And Review System)

Goal: complete core site pages, review templates, and first content batch.

Execution:

1. Use `project-planning` to produce Epic/Task breakdown.
2. Use `frontend-web-dev` to scaffold home, detail, and compare pages.
3. Use `security-best-practices` to establish input validation, API security, and performance baseline.
4. Use `testing-automation` to create smoke tests and key-flow tests.

Deliverables:

- Site information architecture
- Review data templates
- Initial test report

## 2. Phase 2 (SEO + Content + Backlinks)

Goal: establish a sustainable content and SEO growth loop.

Execution:

1. Use `context-engineering` to maintain keyword and template context.
2. Use `project-documenter` for weekly status reports (growth + risks).
3. Use `doublecheck` for source validation of key claims.

Deliverables:

- SEO publishing cadence plan
- Quality checklist
- Weekly retrospective docs

## 3. Phase 3 (Data Dashboard And Commerce Analysis)

Goal: build data-driven decision support for product recommendations.

Execution:

1. Use `technical-spike` to validate data models, scoring, and analysis performance.
2. Use `project-planning` to add data-focused epics and tasks.
3. Use `project-documenter` to publish metrics and reporting definitions.

Deliverables:

- Metrics dictionary
- Dashboard prototype
- Data quality rules

## 4. Phase 4 (Platform Upgrade And Industry IP)

Goal: improve platform maturity, branding, and long-term iteration.

Execution:

1. Use `project-documenter` to publish quarterly roadmap.
2. Use `testing-automation` to complete regression suite and release gates.
3. Use `doublecheck` to verify outbound claims and public data.

Deliverables:

- Quarterly roadmap
- Release quality gates
- External data verification records

## 5. Weekly Cadence (Suggested)

- Monday: plan weekly scope (`project-planning`)
- Wednesday: mid-week quality check (`testing-automation` + `doublecheck`)
- Friday: weekly report and documentation (`project-documenter`)

## 6. Deployment Convention (Cloudflare + Vercel + Neon)

- Static assets and edge delivery: Cloudflare
- Dynamic runtime and APIs: Vercel
- PostgreSQL service: Neon
- Full details: `docs/deployment-convention.md` and `docs/deployment-convention.zh.md`

## 7. Documentation Naming Convention (Required)

- Default document name: `name.md` (English)
- Chinese counterpart name: `name.zh.md`
- Example: `docs/execution-workflow.md` and `docs/execution-workflow.zh.md`
- New documents must be created as bilingual pairs and updated together.
