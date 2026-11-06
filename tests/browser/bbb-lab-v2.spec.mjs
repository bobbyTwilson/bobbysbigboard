import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const labScript=await readFile(new URL('../../scouting-dna-lab.js',import.meta.url),'utf8');
const labCSS=await readFile(new URL('../../scouting-green.css',import.meta.url),'utf8');
async function renderLab(page){
 await page.route('https://a.espncdn.com/**',route=>route.fulfill({
  status:200,contentType:'image/svg+xml',
  body:'<svg xmlns="http://www.w3.org/2000/svg" width="220" height="250"><rect width="220" height="250" fill="#428a59"/></svg>'
 }));
 await page.goto('/robots.txt');
 await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="app"></main></body></html>');
 await page.addStyleTag({content:labCSS});
 await page.addScriptTag({content:labScript});
 await page.evaluate(()=>{
  const players=[
   {player_key:'kc-concepcion',name:'KC Concepcion',team:'CLE',pos:'WR',college:'NC State',overall_breakdown:'Explosive short-area separator.'},
   {player_key:'luther-burden-iii',name:'Luther Burden III',team:'CHI',pos:'WR',college:'Missouri',overall_breakdown:'Hands and toughness after catch.'},
   {player_key:'ungraded',name:'Unknown Quarterback',team:'FA',pos:'QB',college:'Unknown'}
  ];
  const ranks=[
   {player_key:'kc-concepcion',rank:23,market:30,pr:12},
   {player_key:'luther-burden-iii',rank:40,market:25,pr:22}
  ];
  const grades={
   'kc-concepcion':{player_key:'kc-concepcion',grade:79.5,year:2026,comp:'Zay Flowers',traits:{Speed:8.5,Acceleration:9,Catching:3,'Run After Catch':5,Releases:4,'Projected Draft Capital':4}},
   'luther-burden-iii':{player_key:'luther-burden-iii',grade:87,year:2025,comp:'Deebo Samuel',traits:{Speed:8,Acceleration:7,Catching:4,'Run After Catch':4.5,Releases:4.5,'Projected Draft Capital':4}}
  };
  const testing={
   'kc-concepcion':{player_key:'kc-concepcion',height_in:71,weight_lb:188,forty_seconds:4.47,vertical_in:34,broad_in:120,three_cone_seconds:6.8,source_name:'Verified testing'},
   'luther-burden-iii':{player_key:'luther-burden-iii',height_in:73,weight_lb:210,forty_seconds:4.51,vertical_in:35,broad_in:124,three_cone_seconds:6.7,source_name:'Verified testing'}
  };
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bbbDb=async(table,params)=>{
   const key=new URLSearchParams(params).get('player_key')?.replace(/^eq\./,'');
   if(table==='site_prospects')return grades[key]?[grades[key]]:[];
   if(table==='bbb_player_athletics')return testing[key]?[testing[key]]:[];
   return [];
  };
  const portrait=p=>'https://a.espncdn.com/i/headshots/nfl/players/full/'+(p.player_key==='kc-concepcion'?'12345':'67890')+'.png';
  window.BBB_SCOUTING_DNA.lab({
   app:document.querySelector('#app'),profiles:players,ranks,prospects:[],
   bbbDb,portrait,esc,purl:p=>'/scouting/'+p.player_key,setTitle:()=>{}
  });
 });
 await page.locator('[data-bbb-match="kc-concepcion|luther-burden-iii"]').click();
 await expect(page.locator('.bbb-lab-headtohead .bbb-lab-name')).toHaveCount(2);
 await expect(page.locator('.bbb-lab-trait')).not.toHaveCount(0);
}
const valueRow=(page,label)=>page.locator('.bbb-lab-row').filter({has:page.locator('.bbb-lab-row-label', {hasText:label})}).first();

test('MUT-style player portraits, mirrored identity cards and winning-stat glows',async({page})=>{
 await renderLab(page);
 await expect(page.locator('.bbb-lab-card')).toHaveCount(2);
 await expect(page.locator('.bbb-lab-player-photo')).toHaveCount(2);
 await expect(page.locator('.bbb-lab-card-left .bbb-lab-name')).toHaveText('KC Concepcion');
 await expect(page.locator('.bbb-lab-card-right .bbb-lab-name')).toHaveText('Luther Burden III');
 await expect(page.locator('.bbb-lab-versus strong')).toHaveText('VS');
 await expect(valueRow(page,'BBB dynasty rank')).toHaveAttribute('data-edge','left');
 await expect(valueRow(page,'Market rank')).toHaveAttribute('data-edge','right');
 await expect(valueRow(page,'BBB draft grade')).toHaveAttribute('data-edge','right');
 await expect(valueRow(page,'40-yard dash')).toHaveAttribute('data-edge','left');
 await expect(valueRow(page,'Vertical')).toHaveAttribute('data-edge','right');
 await expect(valueRow(page,'Weight')).toHaveAttribute('data-edge','neutral');
 await expect(valueRow(page,'Height')).toHaveAttribute('data-edge','neutral');
 await expect(valueRow(page,'Prospect comp')).toHaveAttribute('data-edge','neutral');
 await expect(page.locator('.bbb-lab-trait').filter({hasText:'Speed'})).toHaveAttribute('data-edge','left');
 await expect(page.locator('.bbb-lab-trait').filter({hasText:'Catching'})).toHaveAttribute('data-edge','right');
 await expect(page.locator('.bbb-lab-traits')).not.toContainText('Projected Draft Capital');
});
test('section edges are separate, overall counts section wins, and swap reverses glow',async({page})=>{
 await renderLab(page);
 await expect(page.locator('.bbb-lab-panel-dna .bbb-lab-section-edge')).toHaveAttribute('data-edge','left');
 await expect(page.locator('.bbb-lab-panel-athletic .bbb-lab-section-edge')).toHaveAttribute('data-edge','right');
 await expect(page.locator('.bbb-lab-overall')).toHaveAttribute('data-edge','even');
 await expect(page.locator('.bbb-lab-overall-score-values')).toContainText('1');
 await page.locator('#bbbLabSwap').click();
 await expect(page.locator('.bbb-lab-card-left .bbb-lab-name')).toHaveText('Luther Burden III');
 await expect(valueRow(page,'40-yard dash')).toHaveAttribute('data-edge','right');
 await expect(valueRow(page,'Vertical')).toHaveAttribute('data-edge','left');
 await expect(page.locator('.bbb-lab-panel-dna .bbb-lab-section-edge')).toHaveAttribute('data-edge','right');
});
test('missing and cross-position data never receive made-up winners',async({page})=>{
 await renderLab(page);
 await page.locator('#bbbLabRight').fill('Unknown Quarterback');
 await expect(page.locator('.bbb-lab-headtohead')).toContainText('Unknown Quarterback');
 await expect(page.locator('.bbb-lab-panel-dna .bbb-lab-section-edge')).toHaveAttribute('data-edge','neutral');
 await expect(valueRow(page,'BBB draft grade')).toHaveAttribute('data-edge','neutral');
 await expect(valueRow(page,'Weight')).toHaveAttribute('data-edge','neutral');
 await expect(page.locator('.bbb-lab-overall')).toHaveAttribute('data-edge','neutral');
});
test('MUT-style compare cards remain side-by-side and fit mobile viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await renderLab(page);
 await expect(page.locator('.bbb-lab-card')).toHaveCount(2);
 const info=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll('.bbb-lab-card')].map(x=>x.getBoundingClientRect());
  return {overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   left:cards[0].left,right:cards[1].left,heights:cards.map(x=>x.height)};
 });
 expect(info.overflow,'Mobile page must not scroll horizontally').toBeLessThanOrEqual(12);
 expect(info.right,'The two player cards should remain opposite each other').toBeGreaterThan(info.left);
 expect(Math.min(...info.heights)).toBeGreaterThan(250);
});


test('clean player photo panels and single stacked trait column on desktop',async({page})=>{
 await renderLab(page);
 const visual=await page.evaluate(()=>{
  const grid=document.querySelector('.bbb-lab-traits');
  const cards=[...grid.querySelectorAll('.bbb-lab-trait')];
  const widths=cards.map(card=>Math.round(card.getBoundingClientRect().width));
  const xs=cards.map(card=>Math.round(card.getBoundingClientRect().left));
  const ys=cards.map(card=>Math.round(card.getBoundingClientRect().top));
  const photoPanels=[...document.querySelectorAll('.bbb-lab-card-art')];
  return {
   cardCount:cards.length,gridWidth:Math.round(grid.getBoundingClientRect().width),
   widths,xs,ys,
   background:photoPanels.map(panel=>getComputedStyle(panel).backgroundImage),
   circles:photoPanels.map(panel=>getComputedStyle(panel,'::before').display),
   initials:photoPanels.map(panel=>getComputedStyle(panel.querySelector('.bbb-lab-photo-fallback')).display),
   cardTextures:[...document.querySelectorAll('.bbb-lab-card')].map(card=>getComputedStyle(card,'::after').display),
   filmGrid:getComputedStyle(document.querySelector('.bbb-lab-editorial')).gridTemplateColumns
  };
 });
 expect(visual.cardCount).toBeGreaterThan(3);
 expect(visual.widths.every(width=>Math.abs(width-visual.gridWidth)<=2),'Each trait occupies the full grid width').toBe(true);
 expect(visual.xs.every(x=>x===visual.xs[0]),'All traits align in one column').toBe(true);
 expect(visual.ys.every((y,i)=>i===0||y>visual.ys[i-1]),'Trait cards stack vertically').toBe(true);
 expect(visual.circles).toEqual(['none','none']);
 expect(visual.initials).toEqual(['none','none']);
 expect(visual.cardTextures).toEqual(['none','none']);
 expect(visual.background.every(background=>background.includes('linear-gradient'))).toBe(true);
 const filmColumns=visual.filmGrid.trim().split(/\s+/);
 expect(filmColumns,'Film notes also use one full-width column').toHaveLength(1);
 await expect(page.locator('.bbb-lab-player-photo')).toHaveCount(2);
 await expect(page.locator('.bbb-lab-trait-head').first()).toBeVisible();
 await expect(page.locator('.bbb-lab-trait-edge-label').first()).toBeVisible();
});

test('single column and winner highlights remain readable on narrow mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await renderLab(page);
 const layout=await page.evaluate(()=>{
  const grid=document.querySelector('.bbb-lab-traits');
  const rows=[...grid.querySelectorAll('.bbb-lab-trait')];
  return {
   overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   gridWidth:grid.getBoundingClientRect().width,
   rowWidth:rows[0].getBoundingClientRect().width,
   rowXs:rows.slice(0,4).map(row=>Math.round(row.getBoundingClientRect().x)),
   fallback:getComputedStyle(document.querySelector('.bbb-lab-photo-fallback')).display
  };
 });
 expect(layout.overflow).toBeLessThanOrEqual(12);
 expect(Math.abs(layout.gridWidth-layout.rowWidth)).toBeLessThanOrEqual(2);
 expect(layout.rowXs.every(x=>x===layout.rowXs[0])).toBe(true);
 expect(layout.fallback).toBe('none');
 await expect(page.locator('.bbb-lab-trait').filter({hasText:'Speed'})).toHaveAttribute('data-edge','left');
 await expect(page.locator('.bbb-lab-trait').filter({hasText:'Catching'})).toHaveAttribute('data-edge','right');
});


test('team logo follows each current NFL team behind the correct portrait',async({page})=>{
 await renderLab(page);
 const left=page.locator('.bbb-lab-card-left .bbb-lab-card-art');
 const right=page.locator('.bbb-lab-card-right .bbb-lab-card-art');
 await expect(left.locator('.bbb-lab-team-watermark')).toHaveAttribute('src','https://a.espncdn.com/i/teamlogos/nfl/500/cle.png');
 await expect(right.locator('.bbb-lab-team-watermark')).toHaveAttribute('src','https://a.espncdn.com/i/teamlogos/nfl/500/chi.png');
 await expect(page.locator('.bbb-lab-team-watermark')).toHaveCount(2);
 const styles=await page.evaluate(()=>{
  return [...document.querySelectorAll('.bbb-lab-card-art')].map(panel=>{
   const watermark=panel.querySelector('.bbb-lab-team-watermark');
   const portrait=panel.querySelector('.bbb-lab-player-photo');
   return {logoZ:Number(getComputedStyle(watermark).zIndex),photoZ:Number(getComputedStyle(portrait).zIndex),
    opacity:Number(getComputedStyle(watermark).opacity),
    pointerEvents:getComputedStyle(watermark).pointerEvents,
    fallback:getComputedStyle(panel.querySelector('.bbb-lab-photo-fallback')).display};
  });
 });
 expect(styles).toHaveLength(2);
 for(const item of styles){
  expect(item.logoZ).toBeLessThan(item.photoZ);
  expect(item.opacity).toBeGreaterThan(0.15);
  expect(item.opacity).toBeLessThan(0.5);
  expect(item.pointerEvents).toBe('none');
  expect(item.fallback).toBe('none');
 }
 const mappings=await page.evaluate(()=>['CLE','CHI','DAL','WSH','FA','UNKNOWN'].map(code=>window.BBB_SCOUTING_DNA.nflLogoCode(code)));
 expect(mappings).toEqual(['cle','chi','dal','was',null,null]);
 await page.locator('#bbbLabSwap').click();
 await expect(page.locator('.bbb-lab-card-left .bbb-lab-team-watermark')).toHaveAttribute('src',/\/chi\.png$/);
 await expect(page.locator('.bbb-lab-card-right .bbb-lab-team-watermark')).toHaveAttribute('src',/\/cle\.png$/);
 await page.locator('#bbbLabRight').fill('Unknown Quarterback');
 await expect(page.locator('.bbb-lab-card-right .bbb-lab-team-watermark')).toHaveCount(0);
 await expect(page.locator('.bbb-lab-card-left .bbb-lab-team-watermark')).toHaveCount(1);
});

test('team watermark card styling is readable on narrow phones with one-column traits',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await renderLab(page);
 const details=await page.evaluate(()=>{
  const panels=[...document.querySelectorAll('.bbb-lab-card-art')];
  const traits=document.querySelector('.bbb-lab-traits');
  const rows=[...traits.querySelectorAll('.bbb-lab-trait')];
  return {overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   portraits:panels.map(panel=>!!panel.querySelector('.bbb-lab-player-photo')),
   logos:panels.map(panel=>!!panel.querySelector('.bbb-lab-team-watermark')),
   gradients:panels.map(panel=>getComputedStyle(panel).backgroundImage.includes('linear-gradient')),
   rowsAligned:rows.slice(0,5).every(row=>Math.abs(row.getBoundingClientRect().width-traits.getBoundingClientRect().width)<2),
   circles:panels.map(panel=>getComputedStyle(panel,'::before').display)};
 });
 expect(details.overflow).toBeLessThanOrEqual(12);
 expect(details.portraits).toEqual([true,true]);
 expect(details.logos).toEqual([true,true]);
 expect(details.gradients).toEqual([true,true]);
 expect(details.rowsAligned).toBe(true);
 expect(details.circles).toEqual(['none','none']);
});
