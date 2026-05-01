-- Seed demo chat conversations for user_id=1 (test@example.com)
-- Explicit session IDs to avoid auto-increment mismatch with message references

-- ============================================================
-- Session A: 初次设置 (设置偏好和推送)
-- ============================================================
INSERT INTO chat_sessions (id, user_id, session_title, status, source_context, created_at, updated_at, last_message_at)
VALUES (10, 1, '初次设置', 'completed', NULL, '2026-04-28 08:00:00', '2026-04-28 08:03:00', '2026-04-28 08:03:00');

-- Message A1: User greeting
INSERT INTO chat_messages (session_id, role, content, message_state, created_at)
VALUES (10, 'user', '你好！我是新用户，帮我介绍一下你能做什么吧', 'recognized', '2026-04-28 08:00:00');

-- Message A2: Assistant greeting + help
INSERT INTO chat_messages (session_id, role, content, message_state, intent_type, candidate_intents_json, confidence, confirmed_type, action_type, result_summary, created_at)
VALUES (10, 'assistant', '你好！我是你的个人AI助手，可以帮你做这些：\n\n· 关注感兴趣的话题，每天推送最新资讯\n· 记录想法和灵感，帮你整理思考\n· 创建待办提醒，不会错过重要事情\n· 随时回顾你的统计和进度\n\n你想从哪个开始？', 'executed', 'help', '["help","greeting"]', 0.95, 'help', 'help', '已介绍功能概览', '2026-04-28 08:00:01');

-- Message A3: User sets interests
INSERT INTO chat_messages (session_id, role, content, message_state, created_at)
VALUES (10, 'user', '我主要关注AI技术和产品设计方面的内容，帮我订阅这两个', 'recognized', '2026-04-28 08:01:00');

-- Message A4: Assistant confirms interests
INSERT INTO chat_messages (session_id, role, content, message_state, intent_type, candidate_intents_json, confidence, confirmed_type, action_type, result_summary, change_log_json, created_at)
VALUES (10, 'assistant', '已为你关注「AI技术」和「产品设计」。每天会推送这两个领域的最新资讯给你。', 'executed', 'add_interest', '["add_interest"]', 0.85, 'add_interest', 'add_interest', '已关注2个话题', '[{"entityType":"note","change":"created","summary":"关注 AI技术"},{"entityType":"note","change":"created","summary":"关注 产品设计"}]', '2026-04-28 08:01:01');

-- Message A5: User sets push time
INSERT INTO chat_messages (session_id, role, content, message_state, created_at)
VALUES (10, 'user', '每天早上9点给我推送就行', 'recognized', '2026-04-28 08:02:00');

-- Message A6: Assistant sets push time
INSERT INTO chat_messages (session_id, role, content, message_state, intent_type, candidate_intents_json, confidence, confirmed_type, action_type, result_summary, created_at)
VALUES (10, 'assistant', '好的，已设置每天早上9:00推送。准时为你送达。', 'executed', 'set_push_time', '["set_push_time"]', 0.92, 'set_push_time', 'set_push_time', '推送时间设为 09:00', '2026-04-28 08:02:01');

-- ============================================================
-- Session B: 灵感记录 (记录想法 + 创建待办)
-- ============================================================
INSERT INTO chat_sessions (id, user_id, session_title, status, source_context, created_at, updated_at, last_message_at)
VALUES (11, 1, '灵感记录', 'completed', NULL, '2026-04-28 14:00:00', '2026-04-28 14:05:00', '2026-04-28 14:05:00');

-- Message B1: User records a thought
INSERT INTO chat_messages (session_id, role, content, message_state, created_at)
VALUES (11, 'user', '突然想到一个有意思的AI应用方向——做一个能自动归纳会议纪要的浏览器插件，值得探索一下', 'recognized', '2026-04-28 14:00:00');

-- Message B2: Assistant records fragmented thought
INSERT INTO chat_messages (session_id, role, content, message_state, intent_type, candidate_intents_json, confidence, confirmed_type, action_type, result_summary, change_log_json, created_at)
VALUES (11, 'assistant', '已记录你的灵感「AI会议纪要插件」。灵感来的时候随时告诉我，这些都是宝贵的思考。', 'executed', 'fragmented_thought', '["fragmented_thought","record_thought"]', 0.82, 'fragmented_thought', 'fragmented_thought', '已保存灵感记录', '[{"entityType":"note","change":"created","summary":"灵感：AI会议纪要插件"}]', '2026-04-28 14:00:01');

-- Message B3: User creates a todo
INSERT INTO chat_messages (session_id, role, content, message_state, created_at)
VALUES (11, 'user', '周五之前要完成产品需求文档，提醒我一下', 'recognized', '2026-04-28 14:02:00');

-- Message B4: Assistant creates todo
INSERT INTO chat_messages (session_id, role, content, message_state, intent_type, candidate_intents_json, confidence, confirmed_type, action_type, result_summary, change_log_json, created_at)
VALUES (11, 'assistant', '已创建待办「完成产品需求文档」，截止：周五。到时候会提醒你。', 'executed', 'create_todo', '["create_todo"]', 0.92, 'create_todo', 'create_todo', '已创建1个待办', '[{"entityType":"todo","change":"created","summary":"创建待办：完成产品需求文档"}]', '2026-04-28 14:02:01');

-- Message B5: User records learning
INSERT INTO chat_messages (session_id, role, content, message_state, created_at)
VALUES (11, 'user', '今天学到的：好的产品设计应该先解决核心痛点，而不是堆砌功能。记住这个原则。', 'recognized', '2026-04-28 14:04:00');

-- Message B6: Assistant records thought
INSERT INTO chat_messages (session_id, role, content, message_state, intent_type, candidate_intents_json, confidence, confirmed_type, action_type, result_summary, change_log_json, created_at)
VALUES (11, 'assistant', '已保存你的思考。这句话总结得真好——核心痛点优先，少即是多。', 'executed', 'record_thought', '["record_thought"]', 0.78, 'record_thought', 'record_thought', '已记录思考', '[{"entityType":"note","change":"created","summary":"思考：产品设计核心痛点优先"}]', '2026-04-28 14:04:01');

-- ============================================================
-- Session C: 内容管理 (查询统计 + 调整订阅) -- ACTIVE session
-- ============================================================
INSERT INTO chat_sessions (id, user_id, session_title, status, source_context, created_at, updated_at, last_message_at)
VALUES (12, 1, '内容管理', 'active', NULL, '2026-04-29 09:00:00', '2026-04-29 09:04:00', '2026-04-29 09:04:00');

-- Message C1: User queries stats
INSERT INTO chat_messages (session_id, role, content, message_state, created_at)
VALUES (12, 'user', '这周记录了哪些内容？帮我回顾一下', 'recognized', '2026-04-29 09:00:00');

-- Message C2: Assistant reports stats
INSERT INTO chat_messages (session_id, role, content, message_state, intent_type, candidate_intents_json, confidence, confirmed_type, action_type, result_summary, created_at)
VALUES (12, 'assistant', '本周概览：\n\n· 灵感记录 2 条\n· 待办事项 1 项\n· 关注话题 2 个（AI技术、产品设计）\n\n最近记录活跃，保持这个节奏。', 'executed', 'query_stats', '["query_stats"]', 0.88, 'query_stats', 'query_stats', '查询本周统计', '2026-04-29 09:00:01');

-- Message C3: User adjusts interests
INSERT INTO chat_messages (session_id, role, content, message_state, created_at)
VALUES (12, 'user', '最近AI技术的内容有点多，先取消关注，保留产品设计就好', 'recognized', '2026-04-29 09:02:00');

-- Message C4: Assistant removes interest
INSERT INTO chat_messages (session_id, role, content, message_state, intent_type, candidate_intents_json, confidence, confirmed_type, action_type, result_summary, change_log_json, created_at)
VALUES (12, 'assistant', '已取消关注「AI技术」。现在你的关注列表：产品设计。随时可以重新关注。', 'executed', 'remove_interest', '["remove_interest"]', 0.90, 'remove_interest', 'remove_interest', '已取消1个话题关注', '[{"entityType":"note","change":"cancelled","summary":"取消关注 AI技术"}]', '2026-04-29 09:02:01');

-- Message C5: User adds meeting todo
INSERT INTO chat_messages (session_id, role, content, message_state, created_at)
VALUES (12, 'user', '对了，下午3点有个产品评审会议，帮我也记一下', 'recognized', '2026-04-29 09:03:00');

-- Message C6: Assistant creates meeting todo
INSERT INTO chat_messages (session_id, role, content, message_state, intent_type, candidate_intents_json, confidence, confirmed_type, action_type, result_summary, change_log_json, created_at)
VALUES (12, 'assistant', '已添加待办「产品评审会议」，时间：今天下午3:00。会前15分钟提醒你。', 'executed', 'create_todo', '["create_todo"]', 0.85, 'create_todo', 'create_todo', '已添加会议待办', '[{"entityType":"todo","change":"created","summary":"创建待办：产品评审会议"}]', '2026-04-29 09:03:01');
