import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const commandCenterScript = await readFile(new URL('../../bbb-plus-command-center.js', import.meta.url), 'utf8');

// These are isolated UI simulations. There is no real Stripe request, paid
// subscription, login attempt, account mutation, or Supabase write.
const testUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'bdd-test@invalid.example'
};
const member = {
  user_id: testUser.id,
  status: 'active',
  plan_interval: 'month',
  founding_member: true,
  cancel_at_period_end: false,
  current_period_end: '2027-01-20T00:00:00Z'
};
const session = {
  access_token: 'fake_playwright_member_token_do_not_use',
  refresh_token: 'fake_playwright_refresh_token_do_not_use',
  expires_at: 4102444800,
  user: testUser
};

async function mockMember(page,{entitled=true,subscription=member,source='membership',portalUrl,checkoutUrl}={}){
  const activity={portal:0,checkout:0,auth:0,unhandled:[]};
  await page.addInitScript(s=>{
    try{
      if(location.hostname==='bobbysbigboard.com')
        localStorage.setItem('bbb_auth_session_v1',JSON.stringify(s));
    }catch{}
  },session);
  const cors={
    'access-control-allow-origin':'*',
    'access-control-allow-headers':'apikey, authorization, content-type',
    'access-control-allow-methods':'GET, POST, OPTIONS'
  };
  // Public visitor tests hit the live domain. Simulations intentionally serve
  // this PR's updated Command Center JS so the billing fix is tested BEFORE merge.
  await page.route('**/bbb-plus-command-center.js',route=>route.fulfill({
    status:200,contentType:'application/javascript',body:commandCenterScript
  }));
  await page.route('https://twbduhmibbotregdxlla.supabase.co/**',async route=>{
    const request=route.request();
    const url=new URL(request.url());
    if(request.method()==='OPTIONS'){
      return route.fulfill({status:204,headers:cors,body:''});
    }
    const ok=(data,status=200)=>route.fulfill({
      status,headers:{...cors,'content-type':'application/json'},body:JSON.stringify(data)
    });
    if(url.pathname==='/rest/v1/bbb_plus_memberships')return ok(subscription?[subscription]:[]);
    if(url.pathname==='/rest/v1/user_profiles')return ok([{id:testUser.id,username:'TestMember',display_name:'TestMember'}]);
    if(url.pathname==='/functions/v1/bbb-plus-entitlement')return ok({has_access:entitled,source:entitled?source:null});
    if(url.pathname==='/functions/v1/bbb-plus-command-center'){
      return entitled
        ?ok({access:{source,membership:subscription},players:[],market_edges:[],summary:{player_count:0,meaningful_movers:0,health_attention:0}})
        :ok({error:'BBB+ subscription required'},403);
    }
    if(url.pathname==='/functions/v1/bbb-plus-public-status')return ok({founding_claimed:1,founding_cap:100,founding_remaining:99,founding_full:false});
    if(url.pathname==='/functions/v1/bbb-plus-portal'){
      activity.portal++;
      return ok({url:portalUrl||'https://billing.stripe.com/p/session/test_bbb_member'});
    }
    if(url.pathname==='/functions/v1/bbb-plus-checkout'){
      activity.checkout++;
      return ok({url:checkoutUrl||'https://checkout.stripe.com/c/pay/test_bbb_member'});
    }
    if(url.pathname.includes('/auth/v1/')){
      activity.auth++;
      return ok({error:'No real auth requests allowed in the simulator'},403);
    }
    activity.unhandled.push(url.pathname);
    return ok([]);
  });
  return activity;
}

test.describe('simulated paid subscriber journey (network fully mocked)',()=>{
  test('active member enters Command Center with billing controls and no checkout', async ({page})=>{
    const activity=await mockMember(page);
    await page.goto('/plus');
    const frame=page.frameLocator('#bbbMemberFrame');
    await expect(frame.locator('.bbbcc-title')).toContainText('YOUR BOARD', {timeout:30000});
    await expect(frame.locator('.bbbcc-member')).toContainText('FOUNDING MEMBER');
    await expect(frame.locator('[data-bbbcc-billing]').first()).toBeVisible();
    await expect(frame.locator('#bbbPlusCheckout')).toHaveCount(0);
    expect(activity.checkout).toBe(0);
    expect(activity.portal).toBe(0);
    expect(activity.auth).toBe(0);
  });

  test('scheduled cancellation retains premium access and explains the end date',async ({page})=>{
    const ending={...member,cancel_at_period_end:true,plan_interval:'year'};
    const activity=await mockMember(page,{subscription:ending});
    await page.goto('/plus');
    const frame=page.frameLocator('#bbbMemberFrame');
    await expect(frame.locator('.bbbcc-title')).toBeVisible({timeout:30000});
    await expect(frame.locator('.bbbcc-membership.cancel')).toContainText('Cancellation scheduled');
    await expect(frame.locator('.bbbcc-membership.cancel')).toContainText('Jan 20, 2027');
    await expect(frame.locator('[data-bbbcc-billing]').first()).toContainText('MANAGE MEMBERSHIP');
    expect(activity.checkout).toBe(0);
  });

  test('expired subscription does not reveal Command Center and shows rejoin',async ({page})=>{
    const inactive={...member,status:'canceled',cancel_at_period_end:false};
    const activity=await mockMember(page,{subscription:inactive,entitled:false});
    await page.goto('/plus');
    const frame=page.frameLocator('#bbbMemberFrame');
    await expect(frame.locator('#bbbPlusCheckout')).toBeVisible({timeout:30000});
    await expect(frame.locator('.bbbcc-title')).toHaveCount(0);
    await expect(frame.locator('[data-bbbcc-billing]')).toHaveCount(0);
    expect(activity.checkout).toBe(0);
  });

  test('active member billing portal opens in TOP browser tab, never the iframe',async ({page})=>{
    const activity=await mockMember(page);
    await page.route('https://billing.stripe.com/**', route=>route.fulfill({
      status:200,contentType:'text/html',body:'<html><body><h1>MOCK BILLING PORTAL</h1></body></html>'
    }));
    await page.goto('/plus');
    const frame=page.frameLocator('#bbbMemberFrame');
    await expect(frame.locator('.bbbcc-title')).toBeVisible({timeout:30000});
    await frame.locator('[data-bbbcc-billing]').first().click();
    await expect(page).toHaveURL(/^https:\/\/billing\.stripe\.com\//,{timeout:15000});
    await expect(page.locator('h1')).toHaveText('MOCK BILLING PORTAL');
    expect(activity.portal).toBe(1);
    expect(activity.checkout).toBe(0);
  });

  test('Command Center refuses a non-Stripe portal URL', async ({page})=>{
    const activity=await mockMember(page,{portalUrl:'https://example.org/not-stripe'});
    await page.goto('/plus');
    const frame=page.frameLocator('#bbbMemberFrame');
    await expect(frame.locator('.bbbcc-title')).toBeVisible({timeout:30000});
    const dialog=page.waitForEvent('dialog');
    await frame.locator('[data-bbbcc-billing]').first().click();
    const alert=await dialog;
    expect(alert.message()).toMatch(/unexpected destination/i);
    await alert.dismiss();
    await expect(page).toHaveURL(/bobbysbigboard\.com\/plus/);
    expect(activity.portal).toBe(1);
  });

  test('unsubscribed signed-in visitor can open simulated checkout in the top tab',async({page})=>{
    const activity=await mockMember(page,{entitled:false,subscription:null});
    await page.route('https://checkout.stripe.com/**',route=>route.fulfill({
      status:200,contentType:'text/html',body:'<html><body><h1>MOCK CHECKOUT</h1></body></html>'
    }));
    await page.goto('/plus');
    const frame=page.frameLocator('#bbbMemberFrame');
    await expect(frame.locator('#bbbPlusCheckout')).toBeVisible({timeout:30000});
    await frame.locator('#bbbPlusCheckout').click();
    await expect(page).toHaveURL(/^https:\/\/checkout\.stripe\.com\//,{timeout:15000});
    await expect(page.locator('h1')).toHaveText('MOCK CHECKOUT');
    expect(activity.checkout).toBe(1);
    expect(activity.portal).toBe(0);
  });
});
