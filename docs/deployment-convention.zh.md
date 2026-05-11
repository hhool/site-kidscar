# 部署约定

## 适用范围

本项目采用分层部署模型：

- 静态资源与边缘缓存：Cloudflare
- 动态应用与 Serverless API：Vercel
- PostgreSQL 数据库服务：Neon

## 职责边界

## Cloudflare（静态 + 边缘）

- 托管公开站点的静态页面与静态资源
- 提供 CDN 缓存与边缘加速
- 承担安全控制（WAF、Bot 防护、限流）
- 管理 DNS 与 TLS 证书

建议托管目标：

- `src/pages/**` 下的静态页面
- `src/pages/assets/**` 下的预构建前端资源

## Vercel（动态）

- 承载动态路由与 Serverless API
- 管理运行时环境变量与 Preview 环境
- 基于 Git 流程进行分支预览与生产发布

建议托管目标：

- 对比/查询/报表等 API 路由
- 若需要 SEO 动态渲染，可承载 SSR 路由

## Neon（数据库）

- 存储评测数据、来源追溯字段与分析表
- 使用角色权限最小化原则与连接池
- 迁移脚本纳入仓库，通过 CI 或受控发布任务执行

## 环境变量约定

- `SITE_ENV`（`development` | `preview` | `production`）
- `NEON_DATABASE_URL`（仅服务端可用，禁止暴露到浏览器）
- `VERCEL_PROJECT_URL`（动态服务基础地址）
- `CF_ZONE_ID` 与 `CF_API_TOKEN`（仅 CI/CD 使用）

禁止将密钥写入仓库，统一使用 Vercel 与 GitHub Secrets。

## 域名与路由约定

示例域名拆分：

- `www.site-kidscar.com` -> Cloudflare 静态站入口
- `api.site-kidscar.com` -> Vercel 动态接口

Cloudflare 统一代理并强制：

- 全站 HTTPS
- 安全响应头
- API 路径限流

## 发布约定

1. 数据质量检查通过（`validate-review-json.sh`、`audit-reviews.sh`）
2. 构建静态资源（`build-reviews-json.sh`）
3. 发布静态包到 Cloudflare 目标
4. 发布动态 API 到 Vercel
5. 对生产 URL 执行冒烟检查

## 观测约定

- Cloudflare：缓存命中率、WAF 事件、回源状态
- Vercel：函数延迟、错误率、冷启动次数
- Neon：查询延迟、连接占用、慢查询日志

## 回滚约定

- 静态回滚：恢复 Cloudflare 上一个可用部署包
- 动态回滚：回退到 Vercel 上一个成功部署版本
- 数据回滚：基于 Neon 分支/时间点恢复，结合迁移版本控制

## 合规提醒

- 数据库记录必须保留来源追溯字段（`source_url`、`source_note`）
- 不确定数据必须标记 `needs_verification = true`
- 未完成来源校验的高风险结论不得对外发布
