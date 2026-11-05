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
    await expect(page.locator('#homeMovers .bbb-home-mover').first()).toBeVisible({ timeout: 30000 });
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


test.describe('guest account and BBB+ membership journeys', () => {
  test('BBB+ plan pricing, billing information and guest signup CTA display without checkout', async ({ page }) => {
    let billingRequests = 0;
    page.on('request', request => {
      if(/\/functions\/v1\/bbb-plus-(?:checkout|portal)/.test(request.url()))billingRequests++;
    });
    await page.goto('/plus');
    const frame = page.frameLocator('#bbbMemberFrame');
    await expect(frame.locator('.bbb-plus-title')).toBeVisible({ timeout: 30000 });
    await expect(frame.locator('#bbbPlusCard .bbb-plus-price')).toContainText('$39.99');
    await frame.locator('#bbbPlusCard [data-int="month"]').click();
    await expect(frame.locator('#bbbPlusCard .bbb-plus-price')).toContainText('$4.99');
    await frame.locator('#bbbPlusCard [data-int="year"]').click();
    await expect(frame.locator('#bbbPlusCard .bbb-plus-price')).toContainText('$39.99');
    await expect(frame.locator('#bbbPlusCheckout')).toHaveCount(0);
    await expect(frame.locator('#bbbPlusPortal')).toHaveCount(0);
    await expect(frame.locator('#bbbPlusSignin')).toBeVisible();
    expect(billingRequests, 'guest must not start Stripe checkout or billing').toBe(0);
  });

  test('guest BBB+ signup CTA opens an actual free account form without creating an account', async ({ page }) => {
    await page.goto('/plus');
    const frame = page.frameLocator('#bbbMemberFrame');
    await expect(frame.locator('#bbbPlusSignin')).toBeVisible({ timeout: 30000 });
    await frame.locator('#bbbPlusSignin').click();
    await expect(frame.locator('#bbbAccountForm')).toBeVisible({ timeout: 20000 });
    await expect(frame.locator('#bbbAccountForm input[name="email"]')).toHaveAttribute('type','email');
    await expect(frame.locator('#bbbAccountForm input[name="password"]')).toHaveAttribute('type','password');
    await expect(frame.locator('#bbbAccountForm input[name="username"]')).toBeVisible();
  });

  test('account login and signup switch without a signup or authentication request', async ({ page }) => {
    const authRequests = [];
    page.on('request', request => {
      if(/\/auth\/v1\/(?:signup|token)/.test(request.url()) &&
         request.method() === 'POST')authRequests.push(request.url());
    });
    await page.goto('/account');
    const frame = page.frameLocator('#bbbMemberFrame');
    await expect(frame.locator('#bbbAccountForm')).toBeVisible({ timeout: 30000 });
    await frame.locator('[data-auth-mode="login"]').click();
    await expect(frame.locator('#bbbAccountForm .bbb-auth-submit')).toHaveText('SIGN IN');
    await expect(frame.locator('#bbbAccountForm input[name="username"]')).toBeHidden();
    await frame.locator('[data-auth-mode="signup"]').click();
    await expect(frame.locator('#bbbAccountForm .bbb-auth-submit')).toHaveText('CREATE FREE ACCOUNT');
    await expect(frame.locator('#bbbAccountForm input[name="username"]')).toBeVisible();
    expect(authRequests, 'navigation alone must not create accounts').toEqual([]);
  });
});

test.describe('growth feature and SEO checks', () => {
  test('Watch Next updates the selected Film Room video', async ({ page }) => {
    await page.goto('/film');
    const item = page.locator('[data-film-next] a').first();
    await expect(item).toBeVisible({ timeout: 30000 });
    const target = await item.getAttribute('href');
    expect(target).toMatch(/^\/film\?video=[A-Za-z0-9_-]{11}$/);
    await item.click();
    await expect(page).toHaveURL(new RegExp('video=' + target.split('video=')[1]));
    await expect(page.locator('.bbb-film-info-head h2')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('.bbb-film-youtube-link')).toHaveAttribute(
      'href', new RegExp(target.split('video=')[1])
    );
    await expect(page.locator('[data-film-next] a')).toHaveCount(3);
  });

  test('ranked player shows actual 30-day and 7-day rank chart', async ({ page }) => {
    await page.goto('/scouting/drake-maye#history');
    await expect(page.locator('.sp-hero h1')).toHaveText('Drake Maye', { timeout: 30000 });
    await expect(page.locator('.sp-tab[data-tab="history"]')).toHaveAttribute('aria-selected','true');
    await expect(page.locator('.sp-history-graph svg')).toBeVisible({ timeout: 12000 }).catch(async error => {
      const panel = await page.locator('#spRankHistory').innerText().catch(() => 'No #spRankHistory');
      const state = await page.evaluate(() => ({
        hash: location.hash,
        rankText: document.querySelector('.sp-dyn-rank')?.textContent?.slice(0,180),
        bodyRank: document.querySelector('#spRankHistory')?.innerHTML?.slice(0,600)
      }));
      throw new Error('Rank history chart missing. Panel=' + panel.slice(0,380) + ' state=' + JSON.stringify(state) + ' cause=' + error.message);
    });
    await expect(page.locator('.sp-history-stats .sp-history-stat')).toHaveCount(4);
  });

  test('scouting profiles expose player-specific content to crawlers', async ({ request }) => {
    for(const [slug,name] of [['kc-concepcion','KC Concepcion'],['drake-maye','Drake Maye']]){
      const response = await request.get('/scouting/' + slug);
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain('<h1>' + name + '</h1>');
      expect(html).toContain('id="bbbSeoPlayerIntro"');
      expect(html).toContain('href="https://bobbysbigboard.com/scouting/' + slug + '"');
    }
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
