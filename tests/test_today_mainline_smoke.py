from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
CONTRACT_DOC_DIR = ROOT_DIR / "文档" / "契约"


def read_contract_doc(name: str) -> str:
    return (CONTRACT_DOC_DIR / name).read_text(encoding="utf-8")


def test_today_article_chat_action_chain_contract():
    today_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "TodayPage.tsx"
    ).read_text(encoding="utf-8")
    article_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ArticlePage.tsx"
    ).read_text(encoding="utf-8")
    chat_page_source = (
        ROOT_DIR / "apps" / "web" / "src" / "pages" / "ChatPage.tsx"
    ).read_text(encoding="utf-8")
    doc_source = read_contract_doc("2026-04-03-Today主链路smoke测试补强.md")

    assert "const handleWorthActingClick = (item: TodayPageData['worthActing'][number]) =>" in today_page_source
    assert "navigate(`/article?ref=${encodeURIComponent(item.contentRef)}`" in today_page_source
    assert "const handleCreateTodoFromOpportunity = useCallback(() =>" in article_page_source
    assert "navigate('/chat', {" in article_page_source
    assert "presetInput: prompt," in article_page_source
    assert "const location = useLocation();" in chat_page_source
    assert "当前动作上下文" in chat_page_source
    assert "直接发送这条动作" in chat_page_source
    assert "Today -> Article -> Chat动作链路" in doc_source
    assert "具备可回归的 smoke 契约测试" in doc_source


def test_user_interests_fact_layer_mainline_contract():
    preferences_source = (
        ROOT_DIR / "app" / "api" / "v1" / "preferences.py"
    ).read_text(encoding="utf-8")
    dashboard_source = (
        ROOT_DIR / "app" / "api" / "v1" / "dashboard.py"
    ).read_text(encoding="utf-8")
    reports_source = (
        ROOT_DIR / "app" / "api" / "v1" / "reports.py"
    ).read_text(encoding="utf-8")
    doc_source = read_contract_doc("2026-04-03-Today主链路smoke测试补强.md")

    assert "row_interests = _load_user_interests_from_rows(db, user_id)" in preferences_source
    assert "return UserInterestsResponse(interests=row_interests)" in preferences_source
    assert "interests = _load_user_interests_from_rows(db, user_id)" in dashboard_source
    assert "interests = _load_user_interests_from_rows(db, user_id)" in reports_source
    assert "interests = _load_user_interests(user)" not in dashboard_source
    assert "interests = _load_user_interests(user)" not in reports_source
    assert "user_interests -> preferences / dashboard / reports" in doc_source
    assert "兴趣事实层主读链路" in doc_source

