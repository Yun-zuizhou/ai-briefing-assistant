-- Briefing semantic demo seed for local D1.
-- Purpose: provide a stable Today/Briefing data sample for UX and UI review.
-- Target demo user: id=1, test@example.com.
-- Copy contract: overview 120-180 zh chars; lead card 70-110; report summaries 45-75.
-- Each block should carry one distinct idea and avoid internal "demo content" wording.

PRAGMA foreign_keys = ON;

INSERT INTO users (
  id, username, email, hashed_password, nickname, avatar, is_active, is_superuser,
  interests, total_read, total_thoughts, total_completed, streak_days, created_at, updated_at, last_login
) VALUES (
  1,
  'testuser',
  'test@example.com',
  'be6eee6cfe51febf1d7fd6838529b150$a929ac4c0832e6c12641347bd458df1f05aad0ec730468e858166365659fa50d',
  '测试用户',
  NULL,
  1,
  0,
  '["AI应用","远程工作","写作素材","数据自动化"]',
  31,
  9,
  4,
  7,
  '2026-03-15 18:22:26',
  '2026-05-01 08:10:00',
  '2026-05-01 08:10:00'
)
ON CONFLICT(id) DO UPDATE SET
  nickname = excluded.nickname,
  interests = excluded.interests,
  total_read = excluded.total_read,
  total_thoughts = excluded.total_thoughts,
  total_completed = excluded.total_completed,
  streak_days = excluded.streak_days,
  updated_at = excluded.updated_at,
  last_login = excluded.last_login;

DELETE FROM user_interests
WHERE user_id = 1;

INSERT INTO user_interests (user_id, interest_name, status, created_at, updated_at)
VALUES
  (1, 'AI应用', 'active', '2026-05-01 08:10:00', '2026-05-01 08:10:00'),
  (1, '远程工作', 'active', '2026-05-01 08:10:00', '2026-05-01 08:10:00'),
  (1, '写作素材', 'active', '2026-05-01 08:10:00', '2026-05-01 08:10:00'),
  (1, '数据自动化', 'active', '2026-05-01 08:10:00', '2026-05-01 08:10:00')
ON CONFLICT(user_id, interest_name) DO UPDATE SET
  status = excluded.status,
  updated_at = excluded.updated_at;

INSERT OR REPLACE INTO hot_topics (
  id, title, summary, content, source, source_url, author, categories, tags, keywords,
  hot_value, view_count, like_count, comment_count, quality_score, relevance_score,
  published_at, fetched_at, hot_comments, guide_questions, raw_data
) VALUES
  (
    9101,
    'AI 代码助手开始进入团队工作台：从个人提效转向流程接入',
    'AI 代码助手正从编辑器补全进入任务分派、代码审查和知识库检索，团队开始重新设计上下文、权限和交付记录。',
    '报道观察到，AI 代码助手正在从编辑器里的补全按钮，变成团队工作台的一部分。它不再只等待开发者输入半行代码，而是开始读取任务背景、引用团队知识库、参与代码审查，并把关键操作留下记录。

这种变化让“代码助手”的产品边界变得更宽。过去团队评估这类工具，常用指标是补全速度、生成质量和节省了多少重复劳动；现在更重要的问题变成：它基于哪些上下文做出建议，能访问哪些仓库和文档，是否把关键决策、引用材料和人工确认过程记录下来。

一些团队已经开始把 AI 代码助手接入任务分派和审查流程。开发者打开任务时，助手会先读取需求说明、相关 issue、最近变更和内部规范，再给出实现路径或风险提示。代码提交前，它也会协助检查测试覆盖、权限边界和接口契约，并把需要人工确认的地方标出来。

这带来新的管理要求。上下文需要可追溯，权限需要按角色和项目范围控制，生成内容需要和人工修改区分，交付记录也要能复盘。否则，团队很难判断某次改动究竟来自真实需求、历史经验，还是一次看似合理但缺少来源的自动建议。

对个人开发者来说，这意味着 AI 工具会更像一个能读项目背景的协作者；对团队而言，它则更像工作台的一层基础设施。真正值得关注的不是它能否生成更多代码，而是它能否让团队在使用 AI 后，仍然保留清楚的上下文、责任边界和交付证据。',
    '演示源·技术产品周刊',
    'https://example.com/briefing-demo/ai-workbench',
    'Demo Desk',
    '["AI应用","开发工具"]',
    '["AI应用","开发工具","团队协作","工作流"]',
    '["AI代码助手","团队工作台","上下文"]',
    1300,
    12800,
    860,
    94,
    9.4,
    9.1,
    '2026-05-01 07:30:00',
    '2026-05-01 08:00:00',
    '[]',
    '["这类工具对个人开发者和团队协作分别意味着什么？","它会改变现有开发流程的哪个环节？"]',
    '{"demo":true,"semantic_role":"lead_candidate","source_layer":"content_candidate"}'
  ),
  (
    9102,
    '远程团队把异步日报改成项目上下文库',
    '远程团队正在把日报从流水账改成项目上下文库，重点记录决策依据、阻塞原因、下一步负责人和参考链接。',
    '远程团队正在把日报从“我今天做了什么”改成“项目现在卡在哪里”。更有价值的记录包括决策依据、阻塞原因、下一步负责人和参考链接。这样跨时区成员不必追聊天记录，也能接上项目上下文。',
    '演示源·远程协作观察',
    'https://example.com/briefing-demo/remote-context-log',
    'Demo Desk',
    '["远程工作","知识管理"]',
    '["远程工作","异步协作","知识管理","团队流程"]',
    '["远程团队","异步日报","上下文库"]',
    1260,
    7600,
    430,
    58,
    8.8,
    8.7,
    '2026-05-01 07:10:00',
    '2026-05-01 08:00:00',
    '[]',
    '["什么信息应该进入上下文库？","普通个人如何借鉴这种记录方式？"]',
    '{"demo":true,"semantic_role":"interest_report","source_layer":"content_candidate"}'
  ),
  (
    9103,
    '创作者把长文草稿拆成资料卡片和观点卡片',
    '写作者开始把素材库拆成来源摘录、事实核对、观点卡片和发布草稿，降低临时拼贴造成的混乱。',
    '写作者开始把素材库拆成四层：来源摘录保存证据，事实核对降低误写，观点卡片承载判断，发布草稿负责表达。这个拆分让长文不再依赖临时拼贴，也更适合记录 AI 辅助参与过哪些环节。',
    '演示源·写作工作流简讯',
    'https://example.com/briefing-demo/writing-cards',
    'Demo Desk',
    '["写作素材","内容创作"]',
    '["写作素材","内容创作","资料卡片","观点卡片"]',
    '["写作流程","资料卡片","观点整理"]',
    1230,
    6900,
    390,
    41,
    8.6,
    8.3,
    '2026-05-01 06:50:00',
    '2026-05-01 08:00:00',
    '[]',
    '["资料卡片和观点卡片如何区分？","这条内容是否能转成个人写作模板？"]',
    '{"demo":true,"semantic_role":"interest_report","source_layer":"content_candidate"}'
  ),
  (
    9104,
    '开源自动化工具新增浏览器任务编排能力',
    '开源自动化项目新增浏览器任务编排示例，把登录、状态检查、数据抽取、结果回写和失败记录连成流程。',
    '开源自动化项目新增了一组浏览器任务编排示例：登录页面、检查状态、抽取数据、写回结果，并记录失败原因。它展示的不是单次脚本技巧，而是把重复网页操作做成可监控流程。',
    '演示源·开源项目追踪',
    'https://example.com/briefing-demo/browser-automation-flow',
    'Demo Desk',
    '["数据自动化","开源项目"]',
    '["数据自动化","开源项目","浏览器自动化","工作流"]',
    '["浏览器任务","自动化","数据抽取"]',
    1200,
    5400,
    260,
    35,
    8.2,
    8.1,
    '2026-05-01 06:30:00',
    '2026-05-01 08:00:00',
    '[]',
    '["这类自动化适合哪些稳定流程？","是否需要把它加入待办进一步研究？"]',
    '{"demo":true,"semantic_role":"interest_report","source_layer":"content_candidate"}'
  ),
  (
    9105,
    '高校写作课开始要求标注 AI 辅助过程',
    '部分写作课要求学生标注 AI 在检索、结构、润色或反方观点生成中的角色，评价重点转向判断过程。',
    '一些课程开始要求学生标注 AI 在写作中承担的角色：资料检索、结构整理、语言润色还是反方观点生成。评价重点从有没有使用 AI，转向学生是否能解释自己的判断。',
    '演示源·教育与技术观察',
    'https://example.com/briefing-demo/ai-writing-disclosure',
    'Demo Desk',
    '["AI应用","写作素材","教育"]',
    '["AI应用","写作素材","教育","过程透明"]',
    '["AI辅助写作","课程规范","过程透明"]',
    1170,
    9300,
    510,
    67,
    8.1,
    7.8,
    '2026-05-01 06:20:00',
    '2026-05-01 08:00:00',
    '[]',
    '["过程透明会怎样影响 AI 写作工具？","个人写作记录是否也需要保留辅助过程？"]',
    '{"demo":true,"semantic_role":"public_hotspot","source_layer":"content_candidate"}'
  ),
  (
    9106,
    '效率工具用户更关注可解释推荐，而不是更多提醒',
    '效率工具反馈显示，用户对更多提醒并不敏感，反而更关心系统为什么推荐某条内容以及不确定性在哪里。',
    '效率工具的反馈样本显示，用户对更多提醒并不敏感，反而更关心系统为什么推荐某条内容。解释如果能说明来源、匹配原因和不确定性，就更容易被用户接受；否则只是另一种噪音。',
    '演示源·产品体验样本',
    'https://example.com/briefing-demo/explainable-recommendation',
    'Demo Desk',
    '["AI应用","知识管理","个人效率"]',
    '["AI应用","推荐理由","个人效率","信息筛选","产品体验"]',
    '["可解释推荐","提醒疲劳","信息筛选"]',
    1140,
    6100,
    300,
    29,
    7.9,
    7.6,
    '2026-05-01 06:00:00',
    '2026-05-01 08:00:00',
    '[]',
    '["简报页需要展示哪些推荐理由？","哪些解释会变成噪音？"]',
    '{"demo":true,"semantic_role":"public_hotspot","source_layer":"content_candidate"}'
  );

INSERT OR REPLACE INTO rss_articles (
  id, title, summary, content, source_id, source_name, source_url, author,
  category, tags, publish_time, fetch_time, guid, quality_score, view_count, raw_data
) VALUES
(
  9301,
  'AI 代码助手开始进入团队工作台：从个人提效转向流程接入',
  'AI 代码助手正从编辑器补全进入任务分派、代码审查和知识库检索，团队开始重新设计上下文、权限和交付记录。',
  'AI 代码助手正在离开单纯的编辑器补全场景，进入团队工作台。新的产品形态不只是根据半行代码预测下一行，而是读取任务背景、引用团队知识库、参与代码审查，并把关键操作留下记录。

这种变化让团队评估代码助手的方式发生了转移。过去常见的问题是生成速度够不够快、补全是否准确、能不能减少重复劳动；现在更重要的问题是：助手基于哪些上下文给出建议，它能访问哪些仓库和文档，关键判断是否能被团队成员复盘。

在一些团队流程里，代码助手已经开始出现在任务分派和代码审查之间。开发者打开任务时，系统会汇总需求说明、相关 issue、近期变更和内部规范，再提示可能的实现路径。提交代码前，它会检查测试覆盖、权限边界和接口契约，并标出需要人工确认的地方。

这也带来了新的治理要求。上下文需要可追溯，权限需要按角色和项目范围控制，AI 生成内容需要和人工修改区分，交付记录也要能回看。否则团队很难判断一次改动究竟来自真实需求、历史经验，还是一次看似合理但缺少来源的自动建议。

对个人开发者来说，AI 工具会更像一个能读项目背景的协作者；对团队而言，它则更像工作台的一层基础设施。真正值得关注的不是它生成了多少代码，而是它是否让团队在使用 AI 后，仍然保留清楚的上下文、责任边界和交付证据。',
  1,
  '演示源·技术产品周刊',
  'https://example.com/briefing-demo/ai-workbench/article',
  'Demo Desk',
  'AI应用',
  '["AI应用","开发工具","团队协作","工作流"]',
  '2026-05-01 07:30:00',
  '2026-05-01 08:00:00',
  'briefing-demo-ai-workbench-article',
  9.4,
  12800,
  '{"demo":true,"semantic_role":"lead_article","source_hot_topic_ref":"hot_topic:9101"}'
),
(
  9302,
  '浏览器自动化工具开始强调可复盘流程',
  '浏览器自动化工具把登录、检查、抽取、回写和失败记录连成流程，和 AI 工作台一样强调过程可追踪。',
  '浏览器自动化工具的最新示例不再只展示一次性脚本，而是把登录、页面状态检查、数据抽取、结果回写和失败记录串成完整流程。对团队来说，这类工具的价值不只是节省点击时间，而是让重复操作能被监控、复现和复盘。',
  1,
  '演示源·开源项目追踪',
  'https://example.com/briefing-demo/browser-automation-flow/article',
  'Demo Desk',
  'AI应用',
  '["AI应用","数据自动化","浏览器自动化","工作流"]',
  '2026-05-01 06:30:00',
  '2026-05-01 08:00:00',
  'briefing-demo-browser-automation-article',
  8.2,
  5400,
  '{"demo":true,"semantic_role":"related_article","source_hot_topic_ref":"hot_topic:9104"}'
);

INSERT OR REPLACE INTO hot_topic_processing_results (
  source_hot_topic_id, source_content_ref, normalized_title, normalized_summary,
  normalized_category_labels_json, normalized_tags_json, quality_score,
  published_at, processing_version, processed_at, is_stale
) VALUES
  (9101, 'hot_topic:9101', 'AI 代码助手开始进入团队工作台', '代码助手正从个人提效工具转向团队流程入口，关键变化是上下文、权限和交付记录开始被产品化。', '["AI应用","开发工具"]', '["AI应用","开发工具","团队协作","工作流"]', 9.4, '2026-05-01 07:30:00', 'briefing-semantic-demo-v1', '2026-05-01 08:05:00', 0),
  (9102, 'hot_topic:9102', '远程团队把异步日报改成项目上下文库', '远程团队把流水账日报转成可复用上下文，重点记录决策依据、阻塞原因、下一步负责人和参考链接。', '["远程工作","知识管理"]', '["远程工作","异步协作","知识管理"]', 8.8, '2026-05-01 07:10:00', 'briefing-semantic-demo-v1', '2026-05-01 08:05:00', 0),
  (9103, 'hot_topic:9103', '长文草稿被拆成资料卡片和观点卡片', '写作流程开始显式区分来源摘录、事实核对、观点卡片和发布草稿，减少临时拼贴带来的混乱。', '["写作素材","内容创作"]', '["写作素材","内容创作","资料卡片"]', 8.6, '2026-05-01 06:50:00', 'briefing-semantic-demo-v1', '2026-05-01 08:05:00', 0),
  (9104, 'hot_topic:9104', '开源自动化工具新增浏览器任务编排能力', '浏览器任务编排示例把登录、页面检查、数据抽取、结果回写和失败记录串成完整链路。', '["数据自动化","开源项目"]', '["数据自动化","开源项目","浏览器自动化"]', 8.2, '2026-05-01 06:30:00', 'briefing-semantic-demo-v1', '2026-05-01 08:05:00', 0),
  (9105, 'hot_topic:9105', '高校写作课要求标注 AI 辅助过程', '课程评价开始关注 AI 辅助发生在检索、结构、润色还是反方观点生成阶段，强调过程透明。', '["AI应用","写作素材","教育"]', '["AI应用","写作素材","教育"]', 8.1, '2026-05-01 06:20:00', 'briefing-semantic-demo-v1', '2026-05-01 08:05:00', 0),
  (9106, 'hot_topic:9106', '效率工具用户更关注可解释推荐', '用户不只是需要更多提醒，也需要知道系统为什么推荐某条内容、匹配了什么关注点、还有哪些不确定性。', '["AI应用","知识管理","个人效率"]', '["AI应用","推荐理由","个人效率","信息筛选"]', 7.9, '2026-05-01 06:00:00', 'briefing-semantic-demo-v1', '2026-05-01 08:05:00', 0);

INSERT OR REPLACE INTO opportunities (
  id, title, type, status, source, source_url, source_id, content, summary, requirements,
  published_at, deadline, start_time, reward, reward_min, reward_max, reward_unit,
  location, is_remote, tags, category, quality_score, reliability_score,
  view_count, favorite_count, fetched_at, updated_at, raw_data
) VALUES
  (
    9201,
    '把 AI 应用工作流拆解写成一篇对外文章',
    'submission',
    'active',
    '演示源·写作机会板',
    'https://example.com/briefing-demo/opportunity-ai-workflow-writing',
    'demo-op-9201',
    '征集真实 AI 应用工作流拆解文章，要求说明问题背景、工具链、数据来源、交付结果和失败处理。',
    '适合把头版线索延展成写作选题：重点写清工具如何进入团队流程，而不是罗列工具清单。',
    '需要 1200 字以上文章草稿、至少 2 个来源链接，并说明一个可复盘的流程节点。',
    '2026-05-01 07:20:00',
    '2026-05-06',
    NULL,
    '入选后获得专题推荐',
    NULL,
    NULL,
    NULL,
    'remote',
    1,
    '["AI应用","写作素材","内容创作"]',
    'writing',
    8.7,
    8.0,
    3200,
    12,
    '2026-05-01 08:00:00',
    '2026-05-01 08:00:00',
    '{"demo":true,"semantic_role":"todo_candidate"}'
  ),
  (
    9202,
    '远程产品助理：整理用户反馈和知识库',
    'job',
    'active',
    '演示源·远程机会板',
    'https://example.com/briefing-demo/opportunity-remote-product-assistant',
    'demo-op-9202',
    '远程产品团队招募兼职助理，主要整理用户反馈、会议记录、需求线索和产品知识库。',
    '可作为远程协作主题的后续线索：工作重点是让分散信息变成团队能复用的上下文。',
    '需要熟悉异步协作、基础文档整理、简单数据表和用户反馈归类。',
    '2026-05-01 07:00:00',
    '2026-05-10',
    NULL,
    '远程兼职',
    NULL,
    NULL,
    NULL,
    'remote',
    1,
    '["远程工作","知识管理","产品"]',
    'job',
    8.3,
    7.8,
    2800,
    9,
    '2026-05-01 08:00:00',
    '2026-05-01 08:00:00',
    '{"demo":true,"semantic_role":"todo_candidate"}'
  ),
  (
    9203,
    '开源自动化项目征集真实工作流案例',
    'contribution',
    'active',
    '演示源·开源任务栏',
    'https://example.com/briefing-demo/opportunity-automation-case',
    'demo-op-9203',
    '项目维护者征集浏览器自动化、资料归档和数据回写案例，用于完善可复用模板库。',
    '适合作为数据自动化方向的验证入口：先保留线索，决定实践时再转入待办。',
    '需要提交流程说明、输入输出样例、失败处理和可复现步骤。',
    '2026-05-01 06:45:00',
    '2026-05-12',
    NULL,
    '贡献者署名',
    NULL,
    NULL,
    NULL,
    'remote',
    1,
    '["数据自动化","开源项目","工作流"]',
    'open_source',
    8.1,
    7.6,
    1900,
    5,
    '2026-05-01 08:00:00',
    '2026-05-01 08:00:00',
    '{"demo":true,"semantic_role":"todo_candidate"}'
  );

INSERT INTO briefings (
  user_id, briefing_date, briefing_type, issue_number, title, summary_text, payload,
  status, generated_at, created_at, updated_at
) VALUES (
  1,
  '2026-05-01',
  'morning',
  20260501,
  '今日内容摘要',
  '今天的简报收束在一个共同变化上：AI 工具、远程协作和写作流程都在从临时提效转向可复用的工作记录。头版先看 AI 代码助手如何进入团队流程；随后用远程日报、写作卡片和浏览器自动化三条报道，判断这套变化是否值得纳入你的项目和写作实践。',
  '{"schemaVersion":"today-briefing-demo-v1","semanticFlow":{"userInterests":["AI应用","远程工作","写作素材","数据自动化"],"sourceLayer":"hot_topics/opportunities demo candidates","processingLayer":"hot_topic_processing_results","pageLayer":"TodayPageData"},"dailyAngle":"今天的主线不是新工具发布，而是工作过程被记录、复用和解释：AI 代码助手进入团队流程，远程日报沉淀为上下文，写作材料被拆成可追踪卡片。","aiBriefing":{"version":"today-briefing-demo-v1","provider":"demo-seed","model":"curated-semantic-template","status":"success","leadSummary":"今天多条候选内容指向同一件事：工具价值正在从帮个人更快完成一步，转向让团队知道过程、依据和下一步。这对 AI 应用、远程协作和写作沉淀都有影响，适合先读头版再核对来源。","topicClusters":[{"title":"AI 应用进入团队工作流","summary":"AI 代码助手开始进入任务分派、代码审查和知识库检索等团队环节。真正值得观察的是上下文、权限和交付记录如何被产品化，而不只是补全速度提高。","confidenceNote":"由代码助手和浏览器自动化两条候选共同支撑，方向一致但仍需看原文细节。","recommendationReason":"命中你的关注项 AI应用 和 数据自动化。","sourceRefs":[{"contentRef":"article:9301","title":"AI 代码助手开始进入团队工作台：从个人提效转向流程接入","sourceLabel":"演示源·技术产品周刊","reason":"头版原文，最能解释今天的共同主线"},{"contentRef":"hot_topic:9104","title":"开源自动化工具新增浏览器任务编排能力","sourceLabel":"演示源·开源项目追踪","reason":"补充数据自动化方向"}]},{"title":"远程协作从日报转向上下文沉淀","summary":"远程团队减少流水账日报，把决策、阻塞和下一步写进项目上下文库。它和 AI 工具的变化相互呼应：协作记录正在成为团队资产。","confidenceNote":"当前演示样例来自单一远程协作来源，适合提示方向，不直接下趋势结论。","recommendationReason":"命中你的关注项 远程工作。","sourceRefs":[{"contentRef":"hot_topic:9102","title":"远程团队把异步日报改成项目上下文库","sourceLabel":"演示源·远程协作观察","reason":"远程工作方向的主要报道"}]},{"title":"写作流程开始显式区分资料和观点","summary":"写作者把资料摘录、事实核对、观点卡片和发布草稿拆开管理。这个变化让写作素材更可追踪，也为 AI 辅助过程留出可解释空间。","confidenceNote":"由写作工作流和 AI 辅助标注两条候选共同支撑，语义相关但来源场景不同。","recommendationReason":"命中你的关注项 写作素材。","sourceRefs":[{"contentRef":"hot_topic:9103","title":"创作者把长文草稿拆成资料卡片和观点卡片","sourceLabel":"演示源·写作工作流简讯","reason":"写作素材方向的主要报道"},{"contentRef":"hot_topic:9105","title":"高校写作课开始要求标注 AI 辅助过程","sourceLabel":"演示源·教育与技术观察","reason":"公共热点与写作关注有交集"}]}],"recommendationReasons":["头版不是按热度挑选，而是选择最能解释今天共同主线的报道。","关注领域报道保留 AI 应用、远程工作、写作素材和数据自动化各一条，避免单一主题刷屏。","行动线索被放在后段，只作为后续处理入口，不打断简报阅读。"],"uncertainties":["演示来源用于呈现语义结构，真实环境仍需要核对原文发布时间、来源可信度和上下文完整性。","当前样例覆盖的是产品与工作流方向，不能代表所有 AI 行业动态。"],"generatedAt":"2026-05-01T08:10:00+08:00"},"leadItem":{"contentRef":"article:9301","itemType":"article","title":"AI 代码助手进入团队流程，价值从补全转向协作记录","summary":"这条头版值得先看，因为它把 AI 代码助手、浏览器自动化和团队知识库放进同一条线：工具不只回答问题，还开始记录谁在何处使用了什么上下文。","sourceLabel":"演示源·技术产品周刊","relevanceLabel":"命中 AI应用、数据自动化","primaryActionLabel":"阅读原文","secondaryActionLabel":"记下判断"},"extensionSlots":[{"slotType":"ask","title":"问这份简报","description":"围绕头版追问：这类团队工作流变化会影响你的项目、写作流程或自动化规划的哪一环。","actionLabel":"去对话","deepLink":"/chat","sourceContentRef":"article:9301"},{"slotType":"save","title":"保存头版线索","description":"把头版原文保存为复盘材料，后续可用于写作选题、项目流程设计或 AI 工具选型。","actionLabel":"保存线索","deepLink":"/collections","sourceContentRef":"article:9301"},{"slotType":"todo","title":"转成待办候选","description":"如果你准备验证浏览器自动化或团队知识库流程，再把它转入待办；现在先保留为后续线索。","actionLabel":"查看待办","deepLink":"/todo","sourceContentRef":"opportunity:9203"}]}',
  'ready',
  '2026-05-01 08:10:00',
  '2026-05-01 08:10:00',
  '2026-05-01 08:10:00'
)
ON CONFLICT(user_id, briefing_date, briefing_type) DO UPDATE SET
  issue_number = excluded.issue_number,
  title = excluded.title,
  summary_text = excluded.summary_text,
  payload = excluded.payload,
  status = excluded.status,
  generated_at = excluded.generated_at,
  updated_at = excluded.updated_at;
