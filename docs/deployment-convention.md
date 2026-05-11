# Deployment Convention

## Scope

This project uses a split deployment model:

- Static assets and edge caching: Cloudflare
- Dynamic application and serverless APIs: Vercel
- PostgreSQL database service: Neon

## Responsibility Boundary

## Cloudflare (Static + Edge)

- Serve static pages/assets for the public website
- Provide CDN caching and edge acceleration
- Apply security controls (WAF, bot protection, rate limits)
- Manage DNS and TLS certificates

Recommended targets:

- Static pages under `src/pages/**`
- Prebuilt frontend assets under `src/pages/assets/**`

## Vercel (Dynamic)

- Host dynamic routes and serverless API endpoints
- Handle runtime environment variables and preview deployments
- Integrate with Git-based CI/CD for branch previews and production releases

Recommended targets:

- API routes for compare/query/report workflows
- Optional SSR routes if needed for SEO-specific dynamic rendering

## Neon (Database)

- Store review records, source traceability fields, and analytics-ready tables
- Use role-based access, least-privilege credentials, and connection pooling
- Keep migration scripts in repository and apply through CI or controlled release jobs

## Environment Variables Convention

- `SITE_ENV` (`development` | `preview` | `production`)
- `NEON_DATABASE_URL` (server-side only, never exposed to browser)
- `VERCEL_PROJECT_URL` (runtime base URL for dynamic services)
- `CF_ZONE_ID` and `CF_API_TOKEN` (CI/CD only)

Do not commit secrets. Use Vercel and GitHub secrets management.

## Domain And Routing Convention

Example domain split:

- `www.site-kidscar.com` -> Cloudflare static entry
- `api.site-kidscar.com` -> Vercel dynamic endpoints

Cloudflare should proxy both domains and enforce:

- HTTPS only
- Security headers
- Rate limiting for API paths

## Release Convention

1. Data quality checks pass (`validate-review-json.sh`, `audit-reviews.sh`)
2. Build static assets (`build-reviews-json.sh`)
3. Deploy static bundle to Cloudflare target
4. Deploy dynamic APIs to Vercel
5. Run smoke checks against production URLs

## Observability Convention

- Cloudflare: cache hit ratio, WAF events, origin status
- Vercel: function latency, error rate, cold start count
- Neon: query latency, connection usage, slow query logs

## Rollback Convention

- Static rollback: restore previous Cloudflare deployment artifact
- Dynamic rollback: promote previous successful Vercel deployment
- Data rollback: use Neon branch/point-in-time restore with migration awareness

## Compliance Notes

- Keep source traceability fields (`source_url`, `source_note`) in DB records
- Mark uncertain records with `needs_verification = true`
- Do not publish high-risk claims without source validation
