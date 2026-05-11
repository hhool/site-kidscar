# site-kidscar 执行工作流（基于已安装插件）

## 0. 当前插件基线

- project-planning
- project-documenter
- frontend-web-dev
- testing-automation
- security-best-practices
- doublecheck
- context-engineering
- technical-spike

## 1. Phase 1（建站与评测体系）

目标：完成基础站点、评测模板、首批内容上架。

执行：

1. 用 `project-planning` 输出 Epic/Task。
2. 用 `frontend-web-dev` 生成首页、评测详情页、对比页骨架。
3. 用 `security-best-practices` 建立输入校验、API 安全和基础性能规则。
4. 用 `testing-automation` 建立页面冒烟测试与核心流程测试。

交付物：

- 站点信息架构
- 评测数据模板
- 首批测试报告

## 2. Phase 2（SEO + 内容 + 外链）

目标：形成可持续内容生产与 SEO 增长闭环。

执行：

1. 用 `context-engineering` 维护关键词、栏目、模板上下文。
2. 用 `project-documenter` 周更阶段报告（增长数据 + 风险项）。
3. 用 `doublecheck` 对关键结论做来源校验。

交付物：

- SEO 内容节奏表
- 质量校验清单
- 周度复盘文档

## 3. Phase 3（数据报表与导购分析）

目标：形成评测数据驱动的导购决策能力。

执行：

1. 用 `technical-spike` 验证数据模型、评分方法、分析性能。
2. 用 `project-planning` 增补数据类 Epic 与任务拆解。
3. 用 `project-documenter` 输出报表方案与指标定义。

交付物：

- 指标字典
- 报表原型
- 数据质量规则

## 4. Phase 4（平台升级与行业 IP）

目标：平台化、品牌化和可持续迭代。

执行：

1. 用 `project-documenter` 输出季度路线图。
2. 用 `testing-automation` 补齐回归套件与发布门禁。
3. 用 `doublecheck` 审核对外发布的关键数据与结论。

交付物：

- 季度路线图
- 发布质量门禁
- 对外数据核验记录

## 5. 每周固定节奏（建议）

- 周一：规划本周任务（project-planning）
- 周三：中期质量检查（testing-automation + doublecheck）
- 周五：阶段汇报与沉淀（project-documenter）

## 6. 部署约定（Cloudflare + Vercel + Neon）

- 静态资源与边缘分发：Cloudflare
- 动态运行时与 API：Vercel
- PostgreSQL 数据库服务：Neon
- 详细说明见：`docs/deployment-convention.md` 与 `docs/deployment-convention.zh.md`

## 7. 文档命名规范（强制）

- 默认文档命名：`name.md`（英文）
- 中文说明命名：`name.zh.md`
- 示例：`docs/execution-workflow.md` 与 `docs/execution-workflow.zh.md`
- 新增文档时必须成对创建，保持中英文同步更新。
