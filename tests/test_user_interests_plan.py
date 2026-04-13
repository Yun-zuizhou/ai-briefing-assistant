from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]


def test_user_interest_model_and_plan_exist():
    model_source = (ROOT_DIR / "app" / "models" / "user_interest.py").read_text(encoding="utf-8")
    init_source = (ROOT_DIR / "app" / "models" / "__init__.py").read_text(encoding="utf-8")
    doc_source = (
        ROOT_DIR / "文档" / "契约" / "2026-04-03-user_interests接轨方案.md"
    ).read_text(encoding="utf-8")

    assert '__tablename__ = "user_interests"' in model_source
    assert "interest_name" in model_source
    assert '"UserInterest"' in init_source
    assert "先模型落位 -> 再双写 -> 再逐步切主读" in doc_source


def test_preferences_and_chat_now_include_user_interests_double_write_contract():
    preferences_source = (ROOT_DIR / "app" / "api" / "v1" / "preferences.py").read_text(encoding="utf-8")
    chat_source = (ROOT_DIR / "app" / "api" / "v1" / "chat.py").read_text(encoding="utf-8")
    roadmap_source = (ROOT_DIR / "文档" / "项目核心总纲.md").read_text(encoding="utf-8")

    assert "def _sync_user_interests_rows" in preferences_source
    assert "_sync_user_interests_rows(db, user_id, payload.interests)" in preferences_source
    assert "def _sync_user_interests_rows" in chat_source
    assert "_sync_user_interests_rows(db, user_id, updated)" in chat_source
    assert "Cloudflare D1 真实接管" in roadmap_source
    assert "本地 SQLite 到 D1 的迁移 / 双环境配置" in roadmap_source
