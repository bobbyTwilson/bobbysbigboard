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
