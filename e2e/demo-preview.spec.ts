import { expect, test } from '@playwright/test';

test.describe('preview entry browser E2E', () => {
  test('exposes only the formal preview entry from welcome and about', async ({ page }) => {
    await page.goto('/welcome');
    await page.getByRole('button', { name: '下一步' }).click();
    await page.getByRole('button', { name: '下一步' }).click();
    await page.getByRole('button', { name: '查看产品预览' }).click();
    await page.waitForURL('**/preview');
    await expect(page.getByText('正式 UI 的预览入口')).toBeVisible();
    await expect(page.getByText('内容阅读预览')).toBeVisible();
    await expect(page.getByText('收藏与跟进预览')).toBeVisible();

    await page.goto('/login');
    await page.getByLabel('邮箱').fill('test@example.com');
    await page.getByLabel('密码').fill('test123456');
    await page.getByRole('button', { name: /登 录/ }).click();
    await page.waitForURL('**/today');
    await page.getByRole('button', { name: '我的' }).click();
    await page.waitForURL('**/me');
    await page.getByRole('button', { name: /^帮助反馈/ }).click();
    await page.waitForURL('**/help-feedback');
    await page.goto('/about');
    await page.getByText('产品预览').click();
    await page.waitForURL('**/preview');
    await expect(page.getByText('进入正式产品')).toBeVisible();
  });

  test('does not expose old demo and preview routes through the formal frontend router', async ({ page }) => {
    const blockedPaths = [
      '/marks',
      '/collection-preview',
      '/story-preview',
      '/article-reader-preview',
      '/design-preview',
      '/style-config',
      '/decor-preview',
      '/demo/marks',
      '/demo/collections',
      '/demo/story',
      '/demo/article-reader',
      '/demo/design-preview',
      '/demo/style-preview',
      '/demo/decor-preview',
    ];

    for (const path of blockedPaths) {
      await page.goto(path);
      await page.waitForURL('**/welcome');
      await expect(page.getByText('发现你的信息世界')).toBeVisible();
    }
  });
});
