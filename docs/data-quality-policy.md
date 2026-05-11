# Data Quality Policy (Phase 1)

## Goal

Ensure each review record has minimum traceability and validation quality to support SEO, recommendation analysis, and editorial review.

## Minimum Quality Gate

- Required fields: `slug`, `title_zh`, `title_en`, `summary_zh`, `summary_en`, `source_url`, `verified_at`
- Source requirement: include at least one of `source_url` or `source_note`
- Date format: `verified_at` must be `YYYY-MM-DD`

## Execution

1. Run `scripts/validate-review-json.sh` after data entry.
2. Run `scripts/audit-reviews.sh` before merge.
3. Let CI run validation and smoke checks after push.

## Suggested Metrics

- Total review count
- Pending verification count (`needs_verification = true`)
- Verified ratio
- Count of records missing source fields
