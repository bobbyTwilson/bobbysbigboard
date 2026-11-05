import {test,expect} from '@playwright/test';

test.describe('Scouting DNA and Player Comparison Lab',()=>{
 // PR preview is Vercel-protected and the default test URL is production.
 // Exercise new-feature interactions after merging, when the new code is live.
 test.skip(process.env.GITHUB_EVENT_NAME==='pull_request','New Lab browser checks run against production after release; preview uses build QA.');
 test('KC player profile renders only recorded DNA traits and links into Lab',async({page})=>{
   await page.goto('/scouting/kc-concepcion#dna');
   await expect(page.locator('.sp-hero h1')).toHaveText('KC Concepcion',{timeout:30000});
   await expect(page.locator('.sp-tab[data-tab="dna"]')).toHaveAttribute('aria-selected','true');
   await expect(page.locator('.bbb-dna-radar')).toBeVisible();
   await expect(page.locator('.bbb-dna-status')).toContainText('79.5');
   await expect(page.locator('.bbb-dna-category-grid')).toContainText('Acceleration');
   await expect(page.locator('.bbb-dna-category-grid')).toContainText('8.5 / 10');
   await expect(page.locator('.bbb-dna-category-grid')).not.toContainText('Projected Draft Capital');
   await page.locator('.bbb-dna-compare-link').click();
   await expect(page).toHaveURL(/\/dynasty\/compare\?left=kc-concepcion/);
   await expect(page.locator('#bbbLabLeft')).toHaveValue('KC Concepcion',{timeout:30000});
 });

 test('deep-linked KC vs Luther comparison shows original grades, traits and testing',async({page})=>{
   await page.goto('/dynasty/compare?left=kc-concepcion&right=luther-burden-iii');
   await expect(page.locator('.bbb-lab-headtohead .bbb-lab-name')).toHaveCount(2,{timeout:30000});
   await expect(page.locator('.bbb-lab-headtohead')).toContainText('KC Concepcion');
   await expect(page.locator('.bbb-lab-headtohead')).toContainText('Luther Burden III');
   await expect(page.locator('.bbb-lab-headtohead')).toContainText('79.5');
   await expect(page.locator('.bbb-lab-headtohead')).toContainText('87');
   await expect(page.locator('.bbb-lab-trait')).not.toHaveCount(0);
   await expect(page.locator('.bbb-lab-traits')).toContainText('Run After Catch');
   await expect(page.locator('.bbb-lab-rows').first()).toContainText('Prospect comp');
   await expect(page.locator('.bbb-lab-panel').last()).toContainText('What Bobby saw on tape');
   await page.locator('.bbb-lab-view-dna').last().click();
   await expect(page).toHaveURL(/\/scouting\/luther-burden-iii#dna/);
   await expect(page.locator('.bbb-dna-panel')).toBeVisible({timeout:30000});
 });

 test('Comparison Lab supports selection and swapping without losing a player',async({page})=>{
   await page.goto('/dynasty/compare');
   await expect(page.locator('#bbbLabLeft')).toBeVisible({timeout:30000});
   await page.locator('[data-bbb-match="kc-concepcion|luther-burden-iii"]').click();
   await expect(page.locator('.bbb-lab-headtohead .bbb-lab-name')).toHaveCount(2,{timeout:30000});
   await page.locator('#bbbLabSwap').click();
   await expect(page.locator('#bbbLabLeft')).toHaveValue('Luther Burden III');
   await expect(page.locator('#bbbLabRight')).toHaveValue('KC Concepcion');
   await expect(page).toHaveURL(/left=luther-burden-iii/);
   await expect(page).toHaveURL(/right=kc-concepcion/);
 });

 test('Comparison Lab is usable on mobile without horizontal scrolling',async({page})=>{
   await page.setViewportSize({width:390,height:844});
   await page.goto('/dynasty/compare?left=kc-concepcion&right=bhayshul-tuten');
   await expect(page.locator('.bbb-lab-headtohead')).toBeVisible({timeout:30000});
   await expect(page.locator('.bbb-lab-traits')).toContainText('Speed');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   expect(overflow,'mobile Lab should not overflow viewport').toBeLessThanOrEqual(12);
 });
});
