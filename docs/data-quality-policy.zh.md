# 数据质量策略（Phase 1）

## 目标

确保每条评测数据具备最小可追溯性和可校验性，支持后续 SEO、导购分析与内容复核。

## 最小质量门槛

- 必填字段：`slug`、`title_zh`、`title_en`、`summary_zh`、`summary_en`、`source_url`、`verified_at`
- 来源要求：至少包含 `source_url` 或 `source_note`
- 日期格式：`verified_at` 必须为 `YYYY-MM-DD`

## 执行方式

1. 录入后运行 `scripts/validate-review-json.sh`
2. 合并前运行 `scripts/audit-reviews.sh`
3. 提交后由 CI 工作流自动执行校验与冒烟

## 指标建议

- 评测条目总数
- 待复核条目数量（needs_verification = true）
- 已复核占比
- 缺失来源字段条目数量
