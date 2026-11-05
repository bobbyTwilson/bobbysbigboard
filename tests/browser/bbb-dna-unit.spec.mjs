import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const dnaSource=await readFile(new URL('../../scouting-dna-lab.js',import.meta.url),'utf8');
test('new Comparison Lab module renders and swaps real BBB-style player data in Chrome before merge',async({page})=>{
 await page.goto('/robots.txt');
 await page.setContent('<!doctype html><html><body><main id="app"></main></body></html>');
 await page.addScriptTag({content:dnaSource});
 await page.evaluate(()=>{
  const profiles=[
   {player_key:'kc-concepcion',name:'KC Concepcion',team:'CLE',pos:'WR',college:'NC State',overall_breakdown:'Explosive YAC weapon, route creativity.'},
   {player_key:'luther-burden-iii',name:'Luther Burden III',team:'CHI',pos:'WR',college:'Missouri',overall_breakdown:'Strong hands and run-after-catch ability.'},
   {player_key:'ungraded-qb',name:'Ungraded Quarterback',team:'FA',pos:'QB',college:''}
  ];
  const ranks=[{player_key:'kc-concepcion',name:'KC Concepcion',rank:30,pr:16,market:50},
   {player_key:'luther-burden-iii',name:'Luther Burden III',rank:40,pr:22,market:44}];
  const grades={
   'kc-concepcion':{player_key:'kc-concepcion',year:2026,grade:79.5,comp:'Zay Flowers',traits:{Speed:8.5,Acceleration:9,Catching:3,'Run After Catch':5,'Projected Draft Capital':4}},
   'luther-burden-iii':{player_key:'luther-burden-iii',year:2025,grade:87,comp:'D.J. Moore',traits:{Speed:8,Catching:4,'Run After Catch':4.5,'Projected Draft Capital':4}}
  };
  const testing={
   'kc-concepcion':{player_key:'kc-concepcion',height_in:71,weight_lb:189,forty_seconds:4.45,source_name:'Published testing'},
   'luther-burden-iii':{player_key:'luther-burden-iii',height_in:72,weight_lb:208,forty_seconds:null,source_name:'Published testing'}
  };
  const films={'kc-concepcion':[{video_id:'abcDEFGHijk',title:'KC Concepcion Film',editorial_status:'approved'}]};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bbbDb=async(table,query)=>{
    const key=new URLSearchParams(query).get('player_key')?.replace(/^eq\./,'');
    const row=table==='site_prospects'?grades[key]:table==='bbb_player_athletics'?testing[key]:null;
    return table==='site_bbb_film_catalog'?(films[key]||[]):row?[row]:[];
  };
  window.BBB_SCOUTING_DNA.lab({app:document.querySelector('#app'),profiles,ranks,prospects:[],
   bbbDb,esc,purl:p=>'/scouting/'+p.player_key,setTitle:()=>{}});
 });
 await page.locator('[data-bbb-match="kc-concepcion|luther-burden-iii"]').click();
 await expect(page.locator('.bbb-lab-headtohead .bbb-lab-name')).toHaveCount(2);
 await expect(page.locator('.bbb-lab-headtohead')).toContainText('Luther Burden III');
 await expect(page.locator('.bbb-lab-traits')).toContainText('Run After Catch');
 await expect(page.locator('.bbb-lab-traits')).not.toContainText('Projected Draft Capital');
 await expect(page.locator('.bbb-lab-rows').last()).toContainText('Not recorded');
 await expect(page.locator('.bbb-lab-film a[href^="/film?video="]')).toHaveCount(1);
 await page.locator('#bbbLabSwap').click();
 await expect(page.locator('#bbbLabLeft')).toHaveValue('Luther Burden III');
 await expect(page.locator('#bbbLabRight')).toHaveValue('KC Concepcion');
 await page.locator('#bbbLabRight').fill('Ungraded Quarterback');
 await expect(page.locator('.bbb-lab-headtohead')).toContainText('Not graded');
 await expect(page.locator('.bbb-lab-traits')).toContainText('These players do not have shared BBB trait grades');
});
