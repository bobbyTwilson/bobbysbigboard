import { test, expect } from '@playwright/test';

const kcPath = '/scouting/kc-concepcion';
const loadedProfile = async page => {
  await expect(page.locator('.sp-hero h1')).toHaveText('KC Concepcion', { timeout: 30000 });
};

test.describe('public desktop visitor journeys', () => {
  test('public routes and essential assets respond', async ({ request }) => {
    const routes = [
      '/', '/players', '/film', '/draft', kcPath, '/dynasty/rankings',
      '/dynasty/trade', '/dynasty/compare', '/plus', '/account',
      '/privacy', '/terms', '/billing',
      '/bbb-growth-metrics.js', '/scouting-preview.js',
      '/scouting-film-room-v1.js', '/scouting-profile-v5.js',
      '/favicon.png', '/robots.txt', '/sitemap.xml'
    ];
    for (const path of routes) {
      const res = await request.get(path, { timeout: 18000 });
      expect(res.status(), path + ' returned ' + res.status()).toBe(200);
    }
  });

  test('homepage shows live editorial discovery and links to Film Room', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('THE FILM');
    await expect(page.locator('#homeFeature .featureMeta')).toContainText('NEWEST FILM STUDY', {timeout:30000});
    await expect(page.locator('#homeFeature a[href^="/film?video="]').first()).toBeVisible();
    await expect(page.locator('#homeFilmCards a[href^="/film?video="]').first()).toBeVisible();
    await expect(page.locator('#homeMovers')).not.toContainText('Loading recent movement', {timeout:30000});
    await expect(page.locator('a[href="https://discord.gg/J26MZPyu6q"]').first()).toBeVisible();
    await page.locator('#homeFeature a[href^="/film?video="]').first().click();
    await expect(page).toHaveURL(/\/film\?video=/);
    await expect(page.locator('.bbb-film-room h1')).toBeVisible({timeout:30000});
    await expect(page.locator('[data-film-next] a').first()).toBeVisible();
  });

  test('Film Room player link leads to KC scouting profile and Rank History', async ({ page }) => {
    await page.goto('/film');
    await expect(page.locator('[data-film-search]')).toBeVisible({timeout:30000});
    await page.locator('[data-film-search]').fill('KC Concepcion');
    const item = page.locator('.bbb-film-library [data-film-select]').first();
    await expect(item).toBeVisible({timeout:20000});
    await item.click();
    const profileLink = page.locator('.bbb-film-profile-link');
    await expect(profileLink).toHaveAttribute('href', kcPath);
    await expect(page.locator('[data-film-next] a')).toHaveCount(3);
    await profileLink.click();
    await expect(page).toHaveURL(new RegExp(kcPath));
    await loadedProfile(page);
    await page.locator('.sp-tab[data-tab="history"]').click();
    await expect(page.locator('.sp-tab[data-tab="history"]')).toHaveAttribute('aria-selected','true');
    await expect(page.locator('#spRankHistory')).not.toContainText('Opening rank history', {timeout:25000});
  });

  test('header search finds players and keyboard Escape closes it', async ({ page }) => {
    await page.goto('/');
    await page.locator('.bbb-header-search-trigger').click();
    await expect(page.locator('.bbb-header-search-overlay')).toBeVisible();
    await page.locator('#bbbHeaderSearchInput').fill('KC Concepcion');
    await expect(page.locator('#bbbHeaderSearchResults a[href="' + kcPath + '"]')).toBeVisible({timeout:25000});
    await page.keyboard.press('Escape');
    await expect(page.locator('.bbb-header-search-overlay')).toBeHidden();
    await page.locator('.bbb-header-search-trigger').click();
    await page.locator('#bbbHeaderSearchInput').fill('KC Concepcion');
    await page.locator('#bbbHeaderSearchResults a[href="' + kcPath + '"]').click();
    await loadedProfile(page);
  });

  test('Dynasty dropdown closes after option and back navigation works', async ({ page }) => {
    await page.goto('/');
    const dropdown = page.locator('header details.dropdown');
    await dropdown.locator('summary').click();
    await expect(dropdown).toHaveAttribute('open', '');
    await dropdown.locator('a[href="/dynasty/rankings"]').click();
    await expect(page).toHaveURL(/\/dynasty\/rankings/);
    await expect(dropdown).not.toHaveAttribute('open', '');
    await expect(page.locator('#dynastyToolFrame')).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/bobbysbigboard\.com\/?$/);
    await expect(page.locator('.hero h1')).toContainText('THE FILM');
  });

  test('BBB+ loads the member panel without showing the legacy rankings page', async ({ page }) => {
    await page.goto('/plus');
    await expect(page.locator('#bbbMemberFrame')).toBeVisible({timeout:30000});
    const frame = page.frameLocator('#bbbMemberFrame');
    await expect(frame.locator('html')).toHaveClass(/bbb-embedded-member-boot/, {timeout:25000});
    await expect(frame.locator('#rankingsView')).toBeHidden();
  });
});

test.describe('mobile visitor journeys', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('homepage and Film Room stay usable at narrow width', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#homeFeature .featureMeta')).toContainText('NEWEST FILM STUDY', {timeout:30000});
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'unexpected page-level horizontal overflow').toBeLessThanOrEqual(12);
    await page.locator('header nav a[href="/film"]').click();
    await expect(page.locator('.bbb-film-room h1')).toBeVisible({timeout:30000});
    await expect(page.locator('[data-film-next] a').first()).toBeVisible();
  });

  test('mobile search opens and selects a player', async ({ page }) => {
    await page.goto('/');
    await page.locator('.bbb-header-search-trigger').click();
    await expect(page.locator('.bbb-header-search-overlay')).toBeVisible();
    await page.locator('#bbbHeaderSearchInput').fill('KC Concepcion');
    await page.locator('#bbbHeaderSearchResults a[href="' + kcPath + '"]').click();
    await loadedProfile(page);
    await page.locator('.sp-tab[data-tab="history"]').click();
    await expect(page.locator('#spRankHistory')).not.toContainText('Opening rank history', {timeout:25000});
  });

  test('mobile Dynasty navigation closes its menu and loads tools', async ({ page }) => {
    await page.goto('/');
    const dropdown = page.locator('header details.dropdown');
    await dropdown.locator('summary').click();
    await expect(dropdown).toHaveAttribute('open', '');
    await dropdown.locator('a[href="/dynasty/trade"]').click();
    await expect(page).toHaveURL(/\/dynasty\/trade/);
    await expect(dropdown).not.toHaveAttribute('open', '');
    await expect(page.locator('#dynastyToolFrame')).toBeVisible();
  });
});
