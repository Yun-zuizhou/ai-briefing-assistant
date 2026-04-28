from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
CONTRACT_DOC_DIR = ROOT_DIR / "文档" / "契约"


def read_contract_doc(name: str) -> str:
    return (CONTRACT_DOC_DIR / name).read_text(encoding="utf-8")


def test_dashboard_today_source_contains_content_ref_contract():
    dashboard_source = (ROOT_DIR / "app" / "api" / "v1" / "dashboard.py").read_text(encoding="utf-8")
    projection_source = (ROOT_DIR / "app" / "services" / "content_projection.py").read_text(encoding="utf-8")
    schema_source = (ROOT_DIR / "app" / "api" / "v1" / "page_schemas.py").read_text(encoding="utf-8")
    today_page_source = (ROOT_DIR / "apps" / "web" / "src" / "pages" / "TodayPage.tsx").read_text(encoding="utf-8")

    assert "def build_content_ref(content_type: str, item_id: int | str | None) -> str | None:" in projection_source
    assert "content_ref: str" in schema_source
    assert "def _load_user_interests_from_rows(db: Session, user_id: int) -> list[str]:" in dashboard_source
    assert "interests = _load_user_interests_from_rows(db, user_id)" in dashboard_source
    assert "interests = get_virtual_interests()" not in dashboard_source
    assert "navigate(`/article?ref=${encodeURIComponent(item.contentRef)}`" in today_page_source


def test_unified_content_detail_transition_contract_exists():
    content_source = (ROOT_DIR / "app" / "api" / "v1" / "content.py").read_text(encoding="utf-8")
    main_source = (ROOT_DIR / "app" / "main.py").read_text(encoding="utf-8")
    article_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ArticlePage.tsx"
    ).read_text(encoding="utf-8")

    assert '@router.get("/by-ref", response_model=UnifiedContentDetailResponse' in content_source
    assert 'content_type == "hot_topic"' in content_source
    assert 'content_type == "article"' in content_source
    assert 'content_type == "opportunity"' in content_source
    assert 'app.include_router(content.router, prefix="/api/v1/content", tags=["统一内容"])' in main_source
    assert "getContentDetailByRef" in article_page_source
    assert "new URLSearchParams(location.search)" in article_page_source


def test_hot_topics_and_collections_now_share_content_ref_navigation():
    hot_topics_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "HotTopicsPage.tsx"
    ).read_text(encoding="utf-8")
    collections_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "CollectionsPage.tsx"
    ).read_text(encoding="utf-8")

    assert "const buildContentRef = (contentType: string, id: string | number) =>" in hot_topics_page_source
    assert "navigate(`/article?ref=${encodeURIComponent(contentRef)}`" in hot_topics_page_source
    assert "contentRef," in hot_topics_page_source

    assert "const buildContentRef = (contentType: string, id: string | number) =>" in collections_page_source
    assert "const contentRef = item.content_ref || buildContentRef(item.item_type, item.item_id);" in collections_page_source
    assert "navigate(`/article?ref=${encodeURIComponent(contentRef)}`" in collections_page_source


def test_favorites_now_expose_content_ref_compat_contract():
    favorites_source = (
        ROOT_DIR / "app" / "api" / "v1" / "favorites.py"
    ).read_text(encoding="utf-8")
    article_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ArticlePage.tsx"
    ).read_text(encoding="utf-8")
    types_source = (
        ROOT_DIR / "packages" / "contracts" / "src" / "page-data.ts"
    ).read_text(encoding="utf-8")

    assert 'def _build_content_ref(item_type: str, item_id: int) -> str:' in favorites_source
    assert "content_ref: str" in favorites_source
    assert "if favorite_data.content_ref:" in favorites_source
    assert "content_ref=_build_content_ref(item.item_type, item.item_id)" in favorites_source
    assert "content_ref: activeArticle.contentRef," in article_page_source
    assert "content_ref: string | null;" in types_source


def test_today_mainline_doc_records_content_ref_priority():
    doc_source = read_contract_doc("2026-04-03-Today内容层设计与事实层收束.md")

    assert "统一内容引用键" in doc_source
    assert "content_ref" in doc_source
    assert "/api/v1/content/by-ref" in doc_source
    assert "HotTopicsPage" in doc_source
    assert "CollectionsPage" in doc_source


def test_dashboard_and_reports_interest_fact_layer_doc_exists():
    transition_doc = read_contract_doc("2026-04-03-dashboard与reports兴趣事实层接轨.md")
    reports_source = (ROOT_DIR / "app" / "api" / "v1" / "reports.py").read_text(encoding="utf-8")
    dashboard_source = (ROOT_DIR / "app" / "api" / "v1" / "dashboard.py").read_text(encoding="utf-8")

    assert "Today 兴趣来源顺序" in transition_doc
    assert "正式态(user_interests) -> 空兴趣正式态" in transition_doc
    assert "旧字段只保留影子同步职责" in transition_doc
    assert "interests = _load_user_interests(user)" not in dashboard_source
    assert "def _load_user_interests_from_rows(db: Session, user_id: int) -> list[str]:" in reports_source
    assert "interests = _load_user_interests_from_rows(db, user_id)" in reports_source
    assert "interests = _load_user_interests(user)" not in reports_source


def test_reports_now_expose_hotspot_content_ref_contract():
    projection_source = (ROOT_DIR / "app" / "services" / "content_projection.py").read_text(encoding="utf-8")
    schema_source = (ROOT_DIR / "app" / "api" / "v1" / "page_schemas.py").read_text(encoding="utf-8")
    weekly_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "WeeklyReportPage.tsx"
    ).read_text(encoding="utf-8")
    monthly_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "MonthlyReportPage.tsx"
    ).read_text(encoding="utf-8")

    assert "def build_content_ref(content_type: str, item_id: int | str | None) -> str | None:" in projection_source
    assert "content_ref=hot_spot_content_ref" in projection_source
    assert "content_ref: Optional[str] = None" in schema_source
    assert "handleOpenHotspotDetail" in weekly_page_source
    assert "trend.hotSpot.contentRef" in weekly_page_source
    assert "handleOpenHotspotDetail" in monthly_page_source
    assert "trend.hotSpot.contentRef" in monthly_page_source


def test_history_now_exposes_content_ref_compat_contract():
    history_source = (ROOT_DIR / "app" / "api" / "v1" / "history.py").read_text(encoding="utf-8")
    history_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "HistoryLogsPage.tsx"
    ).read_text(encoding="utf-8")
    types_source = (
        ROOT_DIR / "packages" / "contracts" / "src" / "page-data.ts"
    ).read_text(encoding="utf-8")

    assert 'def _build_content_ref(ref_type: str | None, ref_id: int | None) -> str | None:' in history_source
    assert "content_ref: str | None" in history_source
    assert "content_ref=_build_content_ref(item.ref_type, item.ref_id)" in history_source
    assert "handleOpenDetail" in history_page_source
    assert "统一引用：{record.content_ref}" in history_page_source
    assert "content_ref?: string | null;" in types_source


def test_article_page_now_renders_content_body_from_unified_detail():
    article_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ArticlePage.tsx"
    ).read_text(encoding="utf-8")
    detail_doc_source = read_contract_doc("2026-04-03-内容详情正文层过渡收束.md")

    assert "content: detail.content ?? null," in article_page_source
    assert "正文内容" in article_page_source
    assert "detailState: detail.detailState," in article_page_source
    assert "activeArticle.tags && activeArticle.tags.length > 0" in article_page_source
    assert "统一引用链路已建立，但内容详情正文层还没有真正显示出来" in detail_doc_source
    assert "内容详情正文层已进入最小可展示过渡态" in detail_doc_source


def test_unified_content_detail_now_contains_related_items_contract():
    content_source = (ROOT_DIR / "app" / "api" / "v1" / "content.py").read_text(encoding="utf-8")
    schema_source = (ROOT_DIR / "app" / "api" / "v1" / "page_schemas.py").read_text(encoding="utf-8")
    article_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ArticlePage.tsx"
    ).read_text(encoding="utf-8")
    doc_source = read_contract_doc("2026-04-03-内容相关推荐最小过渡态.md")

    assert "class RelatedContentItem(CamelModel):" in schema_source
    assert "related_items: List[RelatedContentItem] = []" in schema_source
    assert "def _find_related_items(" in content_source
    assert "related_items=_find_related_items(" in content_source
    assert "相关推荐" in article_page_source
    assert "handleRelatedClick" in article_page_source
    assert "relatedItems: detail.relatedItems," in article_page_source
    assert "related_items" in doc_source
    assert "相关推荐已进入最小真实过渡态" in doc_source


def test_today_dashboard_now_contains_processing_fields_contract():
    dashboard_source = (ROOT_DIR / "app" / "api" / "v1" / "dashboard.py").read_text(encoding="utf-8")
    projection_source = (ROOT_DIR / "app" / "services" / "content_projection.py").read_text(encoding="utf-8")
    schema_source = (ROOT_DIR / "app" / "api" / "v1" / "page_schemas.py").read_text(encoding="utf-8")
    today_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "TodayPage.tsx"
    ).read_text(encoding="utf-8")
    doc_source = read_contract_doc("2026-04-03-Today内容加工字段最小收束.md")

    assert "build_recommended_content_item(" in dashboard_source
    assert "build_worth_knowing_item(" in dashboard_source
    assert "build_worth_acting_item(" in dashboard_source
    assert "ranking_score=" in dashboard_source
    assert "processing_stage=processing_stage" in projection_source
    assert "processing_note=" in dashboard_source
    assert "quality_score: Optional[float] = None" in schema_source
    assert "match_score: Optional[int] = None" in schema_source
    assert "processing_stage: Optional[Literal[\"raw\", \"aggregated\", \"ranked\", \"partial\"]] = None" in schema_source
    assert "processing_note: Optional[str] = None" in schema_source
    assert "排序分：" not in today_page_source
    assert "processingNote" not in today_page_source
    assert "引用键：" not in today_page_source
    assert "Today 已进入最小可解释加工过渡态" in doc_source


def test_today_recommendation_section_now_renders_real_top_items():
    today_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "TodayPage.tsx"
    ).read_text(encoding="utf-8")
    doc_source = read_contract_doc("2026-04-03-Today推荐区内容块落地.md")

    assert "const handleRecommendedContentClick =" in today_page_source
    assert "recommendedForYou.flatMap" in today_page_source
    assert "onClick={() => handleRecommendedContentClick(topItem)}" in today_page_source
    assert "关联兴趣：" in today_page_source
    assert "Today 推荐区已有真实结果，但页面仍停留在解释态" in doc_source
    assert "Today 推荐区已进入可点击内容块过渡态" in doc_source


def test_today_worth_acting_now_supports_detail_navigation_and_todo_action():
    today_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "TodayPage.tsx"
    ).read_text(encoding="utf-8")
    doc_source = read_contract_doc("2026-04-03-Today行动区详情链路接入.md")

    assert "const handleWorthActingClick = (item: TodayPageData['worthActing'][number]) =>" in today_page_source
    assert "onClick={() => handleWorthActingClick(item)}" in today_page_source
    assert "event.stopPropagation();" in today_page_source
    assert "navigate(`/article?ref=${encodeURIComponent(item.contentRef)}`" in today_page_source
    assert "worth_acting` 却还停留在“只给转待办按钮”" in doc_source
    assert "Today 行动区已进入“详情 + 行动”双动作过渡态" in doc_source


def test_article_page_now_exposes_opportunity_action_entry():
    article_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ArticlePage.tsx"
    ).read_text(encoding="utf-8")
    doc_source = read_contract_doc("2026-04-03-机会详情页行动入口收束.md")

    assert "const handleCreateTodoFromOpportunity = useCallback(() =>" in article_page_source
    assert "activeArticle.contentType !== 'opportunity'" in article_page_source
    assert "navigate('/chat', {" in article_page_source
    assert "presetInput: prompt," in article_page_source
    assert "sourceContentRef: activeArticle.contentRef," in article_page_source
    assert "机会型内容，已支持从详情页继续进入对话页" in article_page_source
    assert "Today 行动区能进详情，但详情页内还没有行动入口" in doc_source
    assert "机会详情页已进入最小行动闭环过渡态" in doc_source


def test_chat_page_now_accepts_action_context_from_article_page():
    chat_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ChatPage.tsx"
    ).read_text(encoding="utf-8")
    doc_source = read_contract_doc("2026-04-03-Chat页动作上下文接收收束.md")

    assert "const location = useLocation();" in chat_page_source
    assert "presetInput?: string;" in chat_page_source
    assert "sourceContentRef?: string;" in chat_page_source
    assert "sourceTitle?: string;" in chat_page_source
    assert "const [inputValue, setInputValue] = useState(() => actionContext?.presetInput ?? '');" in chat_page_source
    assert "当前动作上下文" in chat_page_source
    assert "直接发送这条动作" in chat_page_source
    assert "详情页动作已能跳到对话页，但对话页还没有动作上下文感知" in doc_source
    assert "Chat 页已进入动作上下文接收过渡态" in doc_source


def test_chat_message_flow_now_carries_intent_analysis_metadata():
    chat_logic_source = (
        ROOT_DIR / "apps" / "web" / "src" / "hooks" / "useChatLogic.ts"
    ).read_text(encoding="utf-8")
    chat_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ChatPage.tsx"
    ).read_text(encoding="utf-8")

    assert "function buildIntentAnalysisMessage(params:" in chat_logic_source
    assert "我先理解成" in chat_logic_source
    assert "也可能是：" in chat_logic_source
    assert "这条我还不够确定，接下来会请你确认一下。" in chat_logic_source
    assert "如果不是这个意思，你也可以马上改。" in chat_logic_source
    assert "candidateIntents: recognitionMeta?.candidateIntents ?? [intent.type]" in chat_logic_source
    assert "confidence: recognitionMeta?.confidence ?? intent.confidence" in chat_logic_source
    assert "sourceContext: recognitionMeta?.sourceContext ?? options?.sourceContext" in chat_logic_source
    assert "matchedBy: recognitionMeta?.matchedBy ?? intent.matchedBy" in chat_logic_source
    assert "candidateIntents?: string[];" in chat_page_source
    assert "confidence?: number;" in chat_page_source
    assert "sourceContext?: string;" in chat_page_source
    assert "matchedBy?: string;" in chat_page_source
    assert "function MessageMeta({" in chat_page_source
    assert "也可能是：" in chat_page_source
    assert "把握大约" in chat_page_source
    assert "当前来自" in chat_page_source
    assert "按 ${matchedBy} 方式识别" in chat_page_source
    assert "text = '我先理解为';" in chat_page_source
    assert "你选一下这条更像哪一种，我就按那个结果处理。" in chat_page_source


def test_chat_execution_actions_now_render_inside_message_flow():
    chat_logic_source = (
        ROOT_DIR / "apps" / "web" / "src" / "hooks" / "useChatLogic.ts"
    ).read_text(encoding="utf-8")
    chat_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ChatPage.tsx"
    ).read_text(encoding="utf-8")

    assert "nextPageLabel?: string;" in chat_logic_source
    assert "quickActions?: Array<{" in chat_logic_source
    assert "nextPageLabel: actionSummary.nextPageLabel," in chat_logic_source
    assert "const messageQuickActions = [" in chat_logic_source
    assert "...(actionSummary.quickActions ?? [])," in chat_logic_source
    assert "messageState === 'executed' && (deepLink || (quickActions && quickActions.length > 0))" in chat_page_source
    assert "QuickActionButton" in chat_page_source
    assert "onMessageAction({ action: nextPageLabel, deepLink })" in chat_page_source
    assert "quickActions?.map((item) => (" in chat_page_source
    assert "我刚刚已经帮你：" in chat_page_source
    assert "具体结果和可继续动作都在下面的消息里，这里只保留本轮摘要。" in chat_page_source
    assert "onMessageAction={handleMessageAction}" in chat_page_source


def test_chat_now_exposes_minimal_post_execution_reclassification_entry():
    chat_logic_source = (
        ROOT_DIR / "apps" / "web" / "src" / "hooks" / "useChatLogic.ts"
    ).read_text(encoding="utf-8")
    chat_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ChatPage.tsx"
    ).read_text(encoding="utf-8")
    types_source = (
        ROOT_DIR / "packages" / "contracts" / "src" / "page-data.ts"
    ).read_text(encoding="utf-8")

    assert "function buildCorrectionQuickActions(userMessage: string, currentType?: string, correctionFrom?: string)" in chat_logic_source
    assert "{ label: '改成待办', targetIntent: 'create_todo' }" in chat_logic_source
    assert "{ label: '改成记录', targetIntent: 'record_thought' }" in chat_logic_source
    assert "{ label: '改成碎片', targetIntent: 'fragmented_thought' }" in chat_logic_source
    assert "{ label: '改成仅聊天', targetIntent: 'chat_only' }" in chat_logic_source
    assert "...buildCorrectionQuickActions(userMessage, actionSummary.confirmedType ?? actionSummary.actionType, correctionFrom)" in chat_logic_source
    assert "targetIntent?: string;" in types_source
    assert "if (item.targetIntent === 'create_todo' || item.targetIntent === 'record_thought' || item.targetIntent === 'fragmented_thought' || item.targetIntent === 'chat_only')" in chat_page_source
    assert "setComposeMode(item.targetIntent);" in chat_page_source
    assert "setInputValue(item.action);" in chat_page_source


def test_chat_post_execution_reclassification_now_calls_backend_when_possible():
    chat_logic_source = (
        ROOT_DIR / "apps" / "web" / "src" / "hooks" / "useChatLogic.ts"
    ).read_text(encoding="utf-8")
    chat_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ChatPage.tsx"
    ).read_text(encoding="utf-8")
    api_source = (
        ROOT_DIR / "apps" / "web" / "src" / "services" / "api.ts"
    ).read_text(encoding="utf-8")
    backend_source = (
        ROOT_DIR / "app" / "api" / "v1" / "chat.py"
    ).read_text(encoding="utf-8")

    assert "async reclassifyChat(data: {" in api_source
    assert "return this.request<ChatExecuteResult>('/chat/reclassify'" in api_source
    assert '@router.post("/reclassify", response_model=ChatExecuteResponse' in backend_source
    assert "const correctionFrom = actionSummary.affectedEntity?.id !== undefined" in chat_logic_source
    assert "correctionFrom," in chat_logic_source
    assert "const reclassifyMessage = useCallback(async (payload:" in chat_logic_source
    assert "const response = await apiService.reclassifyChat({" in chat_logic_source
    assert "if (item.targetIntent && item.correctionFrom) {" in chat_page_source
    assert "void reclassifyMessage({" in chat_page_source


def test_chat_reclassification_result_now_exposes_object_change_log():
    chat_source = (ROOT_DIR / "app" / "api" / "v1" / "chat.py").read_text(encoding="utf-8")
    schema_source = (ROOT_DIR / "app" / "api" / "v1" / "page_schemas.py").read_text(encoding="utf-8")
    types_source = (
        ROOT_DIR / "packages" / "contracts" / "src" / "page-data.ts"
    ).read_text(encoding="utf-8")
    chat_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ChatPage.tsx"
    ).read_text(encoding="utf-8")

    assert "class ChatObjectChange(CamelModel):" in schema_source
    assert "change_log: Optional[List[ChatObjectChange]] = None" in schema_source
    assert "change_log: list[ChatObjectChange] = []" in chat_source
    assert 'ChatObjectChange(entity_type="todo", entity_id=todo.id, change="cancelled", summary="原待办已取消")' in chat_source
    assert 'ChatObjectChange(entity_type="note", entity_id=note.id, change="created", summary="新记录已生成")' in chat_source
    assert "changeLog?: ChatObjectChange[];" in types_source
    assert "changeLog && changeLog.length > 0" in chat_page_source
    assert "item.summary" in chat_page_source


def test_chat_user_facing_copy_now_prefers_user_language_over_system_language():
    chat_logic_source = (
        ROOT_DIR / "apps" / "web" / "src" / "hooks" / "useChatLogic.ts"
    ).read_text(encoding="utf-8")
    chat_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ChatPage.tsx"
    ).read_text(encoding="utf-8")

    assert "我已经帮你" in chat_logic_source
    assert "这次我是按" in chat_logic_source
    assert "如果你现在想继续，可以直接去" in chat_logic_source
    assert "如果不是这个意思，你也可以马上改成" in chat_logic_source
    assert "好，我就按" in chat_logic_source
    assert "好，我准备把这条改成" in chat_logic_source
    assert "FeedbackCard label=\"请你确认\"" in chat_page_source
    assert "FeedbackCard label=\"本轮摘要\"" in chat_page_source


def test_chat_message_visual_hierarchy_now_separates_lead_body_changes_and_actions():
    chat_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ChatPage.tsx"
    ).read_text(encoding="utf-8")

    assert "function MessageBody({ content, isUser }" in chat_page_source
    assert "const [lead, ...rest] = blocks;" in chat_page_source
    assert "className={`chat-message-lead ${isUser ? 'user' : 'assistant'}${rest.length > 0 ? ' has-rest' : ''}`}" in chat_page_source
    assert "rest.length > 0 ? (" in chat_page_source
    assert "className=\"chat-message-rest-list\"" in chat_page_source
    assert "<MessageBody content={content} isUser={isUser} />" in chat_page_source
    assert "className=\"chat-message-change-log\"" in chat_page_source
    assert "item.summary" in chat_page_source


def test_chat_auxiliary_metadata_now_falls_back_to_secondary_text_layer():
    chat_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ChatPage.tsx"
    ).read_text(encoding="utf-8")

    assert "function MessageMeta({" in chat_page_source
    assert "className=\"chat-meta-details\"" in chat_page_source
    assert "className=\"chat-meta-details-body\"" in chat_page_source
    assert "<summary>" in chat_page_source
    assert "<MessageMeta" in chat_page_source


def test_chat_reclassification_now_uses_specific_result_templates():
    chat_logic_source = (
        ROOT_DIR / "apps" / "web" / "src" / "hooks" / "useChatLogic.ts"
    ).read_text(encoding="utf-8")

    assert "function buildReclassifyReply(params:" in chat_logic_source
    assert "我已经把这条改成“记成待办”。" in chat_logic_source
    assert "我已经改成“只聊天”。" in chat_logic_source
    assert "原来的内容我先帮你保留" in chat_logic_source
    assert "新的待办我已经补好了" in chat_logic_source
    assert "原来的结构化结果我已经取消" in chat_logic_source
    assert "如果还是不对，你也可以继续改成" in chat_logic_source
    assert "const reclassifyReply = buildReclassifyReply({" in chat_logic_source


def test_first_batch_behavior_endpoints_now_have_d1_switch_branch():
    preferences_source = (ROOT_DIR / "app" / "api" / "v1" / "preferences.py").read_text(encoding="utf-8")
    todos_source = (ROOT_DIR / "app" / "api" / "v1" / "todos.py").read_text(encoding="utf-8")
    notes_source = (ROOT_DIR / "app" / "api" / "v1" / "notes.py").read_text(encoding="utf-8")
    favorites_source = (ROOT_DIR / "app" / "api" / "v1" / "favorites.py").read_text(encoding="utf-8")
    history_source = (ROOT_DIR / "app" / "api" / "v1" / "history.py").read_text(encoding="utf-8")
    chat_source = (ROOT_DIR / "app" / "api" / "v1" / "chat.py").read_text(encoding="utf-8")
    d1_store_source = (ROOT_DIR / "app" / "services" / "d1_behavior_store.py").read_text(encoding="utf-8")

    assert "from app.services.d1_behavior_store import D1BehaviorStore" in preferences_source
    assert "if settings.D1_USE_CLOUD_AS_SOURCE:" in preferences_source
    assert "D1BehaviorStore().get_user_interests(user_id)" in preferences_source
    assert "D1BehaviorStore().update_user_settings" in preferences_source

    assert "if settings.D1_USE_CLOUD_AS_SOURCE:" in todos_source
    assert "D1BehaviorStore().list_todos" in todos_source
    assert "D1BehaviorStore().create_todo" in todos_source

    assert "D1BehaviorStore().list_notes" in notes_source
    assert "D1BehaviorStore().create_note" in notes_source

    assert "D1BehaviorStore().list_favorites" in favorites_source
    assert "D1BehaviorStore().create_favorite" in favorites_source

    assert "D1BehaviorStore().list_history" in history_source
    assert "D1BehaviorStore().create_history" in history_source

    assert "if settings.D1_USE_CLOUD_AS_SOURCE:" in chat_source
    assert "store.create_chat_todo" in chat_source
    assert "store.create_chat_note" in chat_source
    assert "store.update_interest_action" in chat_source
    assert "store.reclassify_note_to_todo" in chat_source

    assert "class D1BehaviorStore:" in d1_store_source
    assert "def replace_user_interests" in d1_store_source
    assert "def create_chat_todo" in d1_store_source
    assert "def create_chat_note" in d1_store_source
    assert "def reclassify_note_to_todo" in d1_store_source


