import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const root='.vercel/output/static';

async function htmlFiles(dir){
  const entries=await readdir(dir,{withFileTypes:true});
  const out=[];
  for(const entry of entries){
    const path=join(dir,entry.name);
    if(entry.isDirectory())out.push(...await htmlFiles(path));
    else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(path);
  }
  return out;
}

function patchHeader(html){
  html=html.replace(/<a class="nav-cta" href="#trade">TRADE CALCULATOR<\/a>/g,'');
  return html.replace(/<nav class="nav-links">([\s\S]*?)<\/nav>/g,(full,inner)=>{
    let next=inner;
    if(/href="#trade"/.test(next)){
      next=next.replace(/<a href="#trade">Trade Calculator<\/a>/g,'<a href="#trade" class="bbb-trade-nav-link">Trade Calc</a>');
      next=next.replace(/<a href="#trade" class="bbb-trade-nav-link">Trade Calculator<\/a>/g,'<a href="#trade" class="bbb-trade-nav-link">Trade Calc</a>');
    }else{
      const prospect=/<a href="#prospects"[^>]*>[\s\S]*?<\/a>/;
      if(prospect.test(next))next=next.replace(prospect,m=>`${m}<a href="#trade" class="bbb-trade-nav-link">Trade Calc</a>`);
      else next+=`<a href="#trade" class="bbb-trade-nav-link">Trade Calc</a>`;
    }
    return `<nav class="nav-links">${next}</nav>`;
  });
}

let patched=0;
for(const file of await htmlFiles(root)){
  const before=await readFile(file,'utf8');
  const after=patchHeader(before);
  if(after!==before){await writeFile(file,after);patched++;}
}

console.log(`Stabilized Trade Calc in the primary navigation for ${patched} generated HTML pages.`);
