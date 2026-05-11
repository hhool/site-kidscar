# Site Kidscar

Source directory for the global stroller review website.

Chinese version: `README.zh.md`

## Quick Start

1. 使用稳定 CLI 路径检查插件：

```bash
/usr/local/bin/copilot plugin list
```

2. Start development tasks in this directory (recommended: Phase 1 first):

```bash
# Plan Phase 1 epic/task breakdown
/usr/local/bin/copilot run "使用 project-planning 拆解 Phase 1 的 Epic 和 Task"

# Generate phase documentation
/usr/local/bin/copilot run "使用 project-documenter 生成当前项目阶段文档模板"
```

## Phase Workflow

- Detailed flow (EN): [docs/execution-workflow.md](docs/execution-workflow.md)
- Detailed flow (ZH): [docs/execution-workflow.zh.md](docs/execution-workflow.zh.md)
- Deployment convention (EN): [docs/deployment-convention.md](docs/deployment-convention.md)
- Deployment convention (ZH): [docs/deployment-convention.zh.md](docs/deployment-convention.zh.md)
- Global Copilot rules (EN): [.github/copilot-instructions.md](.github/copilot-instructions.md)
- Global Copilot rules (ZH): [.github/copilot-instructions.zh.md](.github/copilot-instructions.zh.md)
- Review/content rules (EN): [.github/instructions/review-content.instructions.md](.github/instructions/review-content.instructions.md)
- Review/content rules (ZH): [.github/instructions/review-content.instructions.zh.md](.github/instructions/review-content.instructions.zh.md)

## Data And Page Commands

```bash
# 1) Validate a single review JSON
./scripts/validate-review-json.sh data/reviews/sample-stroller.json

# 2) Audit full review dataset quality
./scripts/audit-reviews.sh

# 3) Build frontend reviews.json from data/reviews
./scripts/build-reviews-json.sh

# 4) Serve pages locally (default 8080)
./scripts/serve-pages.sh 8080

# 5) Run E2E smoke checks (default 18080)
./e2e/smoke-http-check.sh
```

## CI Quality Gate

- Workflow file: `.github/workflows/site-kidscar-validate.yml`
- Trigger: push / pull_request affecting `site-kidscar/**`
- Pipeline: JSON validation -> data build -> data audit -> page smoke tests

## Markdown Language Convention

- Default file: `name.md` (English)
- Chinese counterpart: `name.zh.md`
- Example: `docs/execution-workflow.md` + `docs/execution-workflow.zh.md`

## Example URLs

- Home: `http://127.0.0.1:8080/index.html`
- Detail: `http://127.0.0.1:8080/review-detail.html?slug=urban-lite-360-2026`
- Compare: `http://127.0.0.1:8080/compare.html?a=urban-lite-360-2026&b=trail-pro-x-2026`
