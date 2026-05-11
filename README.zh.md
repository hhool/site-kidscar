# Site Kidscar

全球垂类童车评测网站源码目录。

英文版：`README.md`

## 快速开始

1. 使用稳定 CLI 路径检查插件：

```bash
/usr/local/bin/copilot plugin list
```

2. 在当前目录启动开发任务（建议先做 Phase 1）：

```bash
# 规划 Phase 1 任务拆解
/usr/local/bin/copilot run "使用 project-planning 拆解 Phase 1 的 Epic 和 Task"

# 生成阶段文档
/usr/local/bin/copilot run "使用 project-documenter 生成当前项目阶段文档模板"
```

## 阶段工作流

- 英文版流程：[docs/execution-workflow.md](docs/execution-workflow.md)
- 中文版流程：[docs/execution-workflow.zh.md](docs/execution-workflow.zh.md)
- 部署约定（英文）：[docs/deployment-convention.md](docs/deployment-convention.md)
- 部署约定（中文）：[docs/deployment-convention.zh.md](docs/deployment-convention.zh.md)
- 全局 Copilot 规则（英文）：[.github/copilot-instructions.md](.github/copilot-instructions.md)
- 全局 Copilot 规则（中文）：[.github/copilot-instructions.zh.md](.github/copilot-instructions.zh.md)
- 评测内容规则（英文）：[.github/instructions/review-content.instructions.md](.github/instructions/review-content.instructions.md)
- 评测内容规则（中文）：[.github/instructions/review-content.instructions.zh.md](.github/instructions/review-content.instructions.zh.md)

## 数据与页面命令

```bash
# 1) 校验单条评测 JSON
./scripts/validate-review-json.sh data/reviews/sample-stroller.json

# 2) 审计全量评测数据质量
./scripts/audit-reviews.sh

# 3) 聚合 data/reviews 到前端数据源
./scripts/build-reviews-json.sh

# 4) 本地预览页面（默认 8080）
./scripts/serve-pages.sh 8080

# 5) 运行 E2E 冒烟检查（默认 18080）
./e2e/smoke-http-check.sh
```

## CI 质量门禁

- 工作流文件：`.github/workflows/site-kidscar-validate.yml`
- 触发条件：`site-kidscar/**` 发生 push / pull request
- 自动执行：JSON 校验 -> 数据聚合 -> 数据审计 -> 页面冒烟

## Markdown 命名规范

- 默认文件：`name.md`（英文）
- 中文对应：`name.zh.md`
- 示例：`docs/execution-workflow.md` + `docs/execution-workflow.zh.md`

## 示例 URL

- 首页：`http://127.0.0.1:8080/index.html`
- 详情页：`http://127.0.0.1:8080/review-detail.html?slug=urban-lite-360-2026`
- 对比页：`http://127.0.0.1:8080/compare.html?a=urban-lite-360-2026&b=trail-pro-x-2026`
