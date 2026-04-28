import { expect, test } from '@playwright/test';

async function loginAsDemoUser(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('邮箱').fill('test@example.com');
  await page.getByLabel('密码', { exact: true }).fill('test123456');
  await page.getByRole('button', { name: /登 录/ }).click();
  await page.waitForURL('**/today');
  await expect(page.getByText(/今天先看|今天先做/).first()).toBeVisible();
}

async function registerFreshUser(page: import('@playwright/test').Page) {
  const seed = Date.now();
  const username = `fresh_user_${seed}`;
  const email = `fresh_user_${seed}@example.com`;

  await page.goto('/welcome');
  await page.getByRole('button', { name: '下一步' }).click();
  await page.getByRole('button', { name: '下一步' }).click();
  await page.getByRole('button', { name: /开始使用/ }).click();
  await page.waitForURL('**/login');

  await page.getByRole('button', { name: '注册' }).click();
  await page.getByLabel('用户名').fill(username);
  await page.getByLabel('邮箱').fill(email);
  await page.getByLabel('密码', { exact: true }).fill('test123456');
  await page.getByLabel('确认密码').fill('test123456');
  await page.getByRole('button', { name: /注 册/ }).click();
  await page.waitForURL('**/interest-config');
  await expect(page.getByText('选择你感兴趣的领域')).toBeVisible();

  await page.getByRole('button', { name: 'AI前沿' }).click();
  await page.getByRole('button', { name: '求职机会' }).click();
  await page.getByRole('button', { name: '编程学习' }).click();
  await page.getByRole('button', { name: '完成' }).click();
  await page.waitForURL('**/today');
  await expect(page.getByText(/今天先看|今天先做/).first()).toBeVisible();
}

test.describe('web + worker browser E2E', () => {
  test('enforces protected-route auth gate, preserves session on reload, and blocks again after logout', async ({ page }) => {
    await page.goto('/today');
    await page.waitForURL('**/welcome');
    await expect(page.getByText('发现你的信息世界')).toBeVisible();

    await loginAsDemoUser(page);

    await page.goto('/me');
    await page.waitForURL('**/me');
    await expect(page.getByText('个人沉淀入口')).toBeVisible();

    await page.reload();
    await page.waitForURL('**/me');
    await expect(page.getByText('个人沉淀入口')).toBeVisible();

    await page.getByRole('button', { name: '退出登录' }).click();
    await page.waitForURL('**/welcome');
    await expect(page.getByText('发现你的信息世界')).toBeVisible();

    await page.goto('/collections');
    await page.waitForURL('**/welcome');
    await expect(page.getByText('发现你的信息世界')).toBeVisible();
  });

  test('supports welcome -> register -> interest-config -> today onboarding flow', async ({ page }) => {
    await registerFreshUser(page);
    await expect(page.getByText('值得知道的', { exact: true })).toBeVisible();
  });

  test('supports login, today browsing, content detail, collect, and collection revisit', async ({ page }) => {
    await loginAsDemoUser(page);

    await expect(page.getByText('因你关注而推荐')).toBeVisible();
    await page.getByText('远程运营专员（AI产品方向）').first().click();

    await page.waitForURL(/\/article\?ref=/);
    await expect(page.getByText('文章详情')).toBeVisible();
    await expect(page.getByRole('button', { name: '收藏' }).or(page.getByRole('button', { name: '已收藏' }))).toBeVisible();

    const hadCollectedState = await page.getByRole('button', { name: '已收藏' }).count() > 0;
    const collectButton = hadCollectedState
      ? page.getByRole('button', { name: '已收藏' })
      : page.getByRole('button', { name: '收藏' });
    await collectButton.click();
    await expect(page.getByRole('button', { name: hadCollectedState ? '收藏' : '已收藏' })).toBeVisible();

    await page.goto('/me');
    await page.waitForURL('**/me');
    await expect(page.getByText('个人沉淀入口')).toBeVisible();

    await page.getByRole('button', { name: /我的收藏/ }).click();
    await page.waitForURL('**/collections');
    await expect(page.getByText('我的收藏')).toBeVisible();
    await expect(page.locator('.collection-card').first()).toBeVisible();
  });

  test('supports actions, growth, settings, and help-feedback navigation with real page interactions', async ({ page }) => {
    await loginAsDemoUser(page);

    await page.getByRole('button', { name: '待办', exact: true }).click();
    await page.waitForURL('**/todo');
    await expect(page.getByText('今天先推进这 1 件')).toBeVisible();
    await expect(page.getByText('待办事项')).toBeVisible();

    await page.goto('/me');
    await page.waitForURL('**/me');

    await page.getByRole('button', { name: /进入成长页/ }).click();
    await page.waitForURL('**/growth');
    await expect(page.getByText('本周成长摘要')).toBeVisible();
    await expect(page.getByText('报告入口')).toBeVisible();

    await page.goto('/me');
    await page.waitForURL('**/me');

    await page.getByRole('button', { name: /设置/ }).first().click();
    await page.waitForURL('**/settings');
    await expect(page.getByText('通知设置')).toBeVisible();

    await page.getByText('推送时间、免打扰、声音提醒').click();
    await page.waitForURL('**/notification-settings');
    await expect(page.getByText('推送时间', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '保存设置' }).click();
    await expect(page.getByRole('button', { name: '已保存' })).toBeVisible();

    await page.goto('/me');
    await page.waitForURL('**/me');
    await page.getByRole('button', { name: /^帮助反馈/ }).click();
    await page.waitForURL('**/help-feedback');
    await expect(page.getByText('常见问题', { exact: true }).first()).toBeVisible();
    await page.getByPlaceholder('请描述你的问题或建议...').fill('浏览器级 E2E 正在验证帮助反馈链路。');
    await page.getByRole('button', { name: '提交反馈' }).click();
    await expect(page.getByRole('button', { name: '已提交' })).toBeVisible();
  });

  test('supports chat, hot-topics, journal, profile, history logs, and about page coverage', async ({ page }) => {
    await loginAsDemoUser(page);

    await page.getByRole('button', { name: /查看全部/ }).click();
    await page.waitForURL('**/hot-topics');
    await expect(page.getByText('热点趋势', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '老夫妻近3万买戒指后被店家跟踪' })).toBeVisible();
    await expect(page.getByText('热点详情')).toBeVisible();

    await page.goto('/chat');
    await page.waitForURL('**/chat');
    await expect(page.getByText('低成本表达入口')).toBeVisible();
    await expect(page.getByText('今天想让我帮你处理什么？')).toBeVisible();
    await page.getByRole('button', { name: '仅聊天' }).click();
    await page.getByLabel('输入消息').fill('这次只是聊天，不保存。');
    await page.getByRole('button', { name: '发送' }).click();
    await expect(page.getByText('这次不会写入待办、记录或关注，只保留对话反馈。').first()).toBeVisible();

    await page.getByRole('button', { name: '日志' }).click();
    await page.waitForURL('**/log');
    await expect(page.getByText('最近沉淀')).toBeVisible();
    await expect(page.getByText('我刚说过的', { exact: true })).toBeVisible();
    await expect(page.getByText('我留下的', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /看历史/ }).click();
    await page.waitForURL('**/history-logs');
    await expect(page.getByText('往日日志')).toBeVisible();

    await page.goto('/me');
    await page.waitForURL('**/me');
    await page.getByRole('button', { name: /用户画像/ }).click();
    await page.waitForURL('**/profile');
    await expect(page.getByText('行为雷达图')).toBeVisible();
    await expect(page.getByText('成长关键词')).toBeVisible();

    await page.goto('/about');
    await expect(page.getByText('主要功能')).toBeVisible();
    await expect(page.getByText('关于')).toBeVisible();
  });

  test('supports report generation pages and history brief revisit flow', async ({ page }) => {
    await loginAsDemoUser(page);

    await page.getByRole('button', { name: '我的' }).click();
    await page.waitForURL('**/me');
    await page.getByRole('button', { name: /进入成长页/ }).click();
    await page.waitForURL('**/growth');

    await page.getByRole('button', { name: '周报' }).click();
    await page.waitForURL('**/weekly-report');
    await expect(page.getByText('本周概览')).toBeVisible();

    await page.goto('/growth');
    await page.getByRole('button', { name: '月报' }).click();
    await page.waitForURL('**/monthly-report');
    await expect(page.getByText('本月概览')).toBeVisible();

    await page.goto('/growth');
    await page.getByRole('button', { name: '年度报告' }).click();
    await page.waitForURL('**/annual-report');
    await expect(page.getByText('我的时代印记')).toBeVisible();

    await page.goto('/me');
    await page.getByRole('button', { name: /历史简报/ }).click();
    await page.waitForURL('**/history-brief');
    await expect(page.getByText('可查看的周期回顾')).toBeVisible();
    await expect(page.getByText('本周回顾周报').first()).toBeVisible();
  });
});
