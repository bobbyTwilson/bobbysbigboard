/* BBB Admin — manual YouTube film publisher. No vidIQ, no YouTube Data API quota. */
(function(){
 'use strict';
 let films=[],players=[],loaded=false,loading=false,editing=null,lookupId='',lastMetadata=null;
 const by=id=>document.getElementById(id);
 const escValue=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const videoUrl=id=>'https://www.youtube.com/watch?v='+encodeURIComponent(id);
 const thumbnail=id=>'https://i.ytimg.com/vi/'+encodeURIComponent(id)+'/hqdefault.jpg';
 function extractVideoId(value){
  const text=String(value||'').trim();
  if(/^[A-Za-z0-9_-]{11}$/.test(text))return text;
  let url;
  try{url=new URL(text)}catch{return null}
  if(url.protocol!=='https:'&&url.protocol!=='http:')return null;
  const host=url.hostname.toLowerCase();
  if(!['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be','www.youtu.be','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host))return null;
  const seg=url.pathname.split('/').filter(Boolean);
  let id='';
  if(host.endsWith('youtu.be'))id=seg[0]||'';
  else if(url.pathname==='/watch')id=url.searchParams.get('v')||'';
  else if(['shorts','live','embed','v'].includes(seg[0]))id=seg[1]||'';
  return /^[A-Za-z0-9_-]{11}$/.test(id)?id:null;
 }
 function status(msg,isError=false){
  const el=by('filmAdminStatus');if(!el)return;
  el.textContent=msg||'';
  el.className='film-admin-status '+(isError?'is-error':'is-success');
 }
 function lookupNotice(msg,kind){
  const el=by('filmAdminLookup');if(!el)return;
  el.textContent=msg;el.dataset.level=kind||'info';
 }
 function portraitSummary(id,title,channel){
  by('filmAdminPreview').hidden=false;
  by('filmAdminPreviewImage').src=thumbnail(id);
  by('filmAdminPreviewTitle').textContent=title||'YouTube video';
  by('filmAdminPreviewChannel').textContent=channel||'Check your channel and public visibility before publishing';
  by('filmAdminWatch').href=videoUrl(id);
 }
 function resetForm(){
  editing=null;lookupId='';lastMetadata=null;
  by('filmAdminForm').reset();by('filmAdminUrl').readOnly=false;
  by('filmAdminEditorTitle').textContent='Add a Film Breakdown';
  by('filmAdminPreview').hidden=true;
  by('filmAdminPlayerSearch').value='';
  renderPlayers('');
  by('filmAdminType').value='nfl_film_study';
  lookupNotice('Paste a public YouTube link to preview its details.','info');
  status('');
 }
 function renderPlayers(query,selected=''){
  const q=String(query||'').trim().toLowerCase();
  const found=players.filter(p=>!q||[p.name,p.team,p.pos,p.college,p.player_key].join(' ').toLowerCase().includes(q));
  const el=by('filmAdminPlayer');
  const old=selected||el.value;
  el.innerHTML='<option value="">'+(found.length?'Select a BBB player…':'No matching BBB players')+'</option>'+found.map(p=>
   '<option value="'+escValue(p.player_key)+'">'+escValue(p.name)+' · '+escValue(p.pos||'?')+' · '+escValue(p.team||p.college||'No team')+'</option>').join('');
  if(found.some(p=>p.player_key===old))el.value=old;
  return found.length;
 }
 function recommendType(playerKey){
  const p=players.find(p=>p.player_key===playerKey);if(!p)return;
  const year=Number(p.draft_year);
  by('filmAdminType').value=year>=2027?'prospect_breakdown':year>=2025&&year<=2026?'rookie_film':'nfl_film_study';
 }
 async function inspect(silent=false){
  const id=extractVideoId(by('filmAdminUrl').value);
  if(!id){
   lookupId='';lastMetadata=null;by('filmAdminPreview').hidden=true;
   lookupNotice('Paste a valid youtube.com, youtu.be, /shorts or /live URL.','error');
   return;
  }
  lookupId=id;
  if(!silent)lookupNotice('Looking up public video information…','info');
  const existing=films.find(f=>f.youtube_video_id===id);
  if(existing){
   if(!by('filmAdminTitle').value.trim())by('filmAdminTitle').value=existing.title;
   portraitSummary(id,by('filmAdminTitle').value,'Already connected to BBB');
   lookupNotice('This video is already linked in BBB. Select its library row to edit.','warn');
  }else portraitSummary(id,by('filmAdminTitle').value.trim()||'Checking title…','');
  try{
   const response=await fetch('/api/youtube-meta?id='+encodeURIComponent(id),{headers:{accept:'application/json'},cache:'default'});
   const data=await response.json();
   if(lookupId!==id)return;
   if(!response.ok)throw new Error(data.error||'Video metadata was unavailable');
   lastMetadata=data;
   if(!by('filmAdminTitle').value.trim()||!silent)by('filmAdminTitle').value=data.title||'';
   portraitSummary(id,data.title,data.channel?'YouTube channel: '+data.channel:'YouTube video');
   lookupNotice('YouTube title loaded. Verify this is your channel before publishing.','success');
  }catch(e){
   if(lookupId!==id)return;
   portraitSummary(id,by('filmAdminTitle').value.trim()||'Video preview','');
   lookupNotice('Automatic title lookup unavailable. Enter the title manually and confirm the video is public.','warn');
  }
 }
 function beginEdit(rowId){
  const row=films.find(f=>Number(f.id)===Number(rowId));if(!row)return;
  editing=row.id;lastMetadata=null;lookupId=row.youtube_video_id||'';
  by('filmAdminUrl').value=videoUrl(lookupId);
  by('filmAdminUrl').readOnly=true;
  by('filmAdminTitle').value=row.title||'';
  by('filmAdminDescription').value=row.description||'';
  by('filmAdminType').value=row.video_type||'nfl_film_study';
  by('filmAdminPlayerSearch').value='';
  renderPlayers('',row.player_key);
  by('filmAdminConfirm').checked=row.editorial_status==='approved';
  by('filmAdminEditorTitle').textContent='Edit Film Breakdown';
  portraitSummary(lookupId,row.title,'Existing BBB video record');
  lookupNotice(row.editorial_status==='approved'?'Already published. Save to update this video.':'Saved draft — publish when ready.','success');
  status('');
  by('filmAdminForm').scrollIntoView({behavior:'smooth',block:'start'});
 }
 function libraryRender(){
  const filter=by('filmAdminLibraryStatus').value,q=by('filmAdminLibrarySearch').value.trim().toLowerCase();
  const visible=films.filter(v=>(filter==='all'||v.editorial_status===filter)&&(!q||[v.title,v.player_key,v.youtube_video_id].join(' ').toLowerCase().includes(q)));
  by('filmAdminLibraryCount').textContent=films.filter(v=>v.editorial_status==='approved').length+' published · '+films.filter(v=>v.editorial_status!=='approved').length+' drafts';
  const node=by('filmAdminLibraryRows');
  node.innerHTML=visible.length?visible.map(f=>{
   const p=players.find(x=>x.player_key===f.player_key);
   return '<div class="film-admin-listrow">'+
    '<a class="film-admin-listimg" href="'+videoUrl(f.youtube_video_id)+'" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="'+thumbnail(f.youtube_video_id)+'" alt=""></a>'+
    '<div class="film-admin-listtext"><strong>'+escValue(f.title)+'</strong><small>'+escValue(p?.name||f.player_key)+' · '+escValue(f.video_type.replace(/_/g,' '))+'</small></div>'+
    '<span class="film-admin-liststate '+(f.editorial_status==='approved'?'published':'draft')+'">'+(f.editorial_status==='approved'?'Published':'Draft')+'</span>'+
    '<button type="button" class="film-admin-editbtn" data-film-edit="'+Number(f.id)+'">Edit</button>'+
    '</div>'
  }).join(''):'<div class="film-admin-empty">No videos match this view.</div>';
  node.querySelectorAll('[data-film-edit]').forEach(button=>button.addEventListener('click',()=>beginEdit(button.dataset.filmEdit)));
 }
 async function load(force=false){
  if(loading)return;
  if(loaded&&!force){libraryRender();return}
  loading=true;
  status('Loading linked films…');
  try{
   const [p,library]=await Promise.all([
    rest('site_profiles?select=player_key,name,pos,team,college,draft_year&order=name.asc&limit=1200'),
    rest('bbb_player_films?select=id,player_key,youtube_video_id,title,description,video_type,editorial_status,published_at,updated_at&order=updated_at.desc&limit=350')
   ]);
   players=Array.isArray(p)?p:[];films=Array.isArray(library)?library:[];
   loaded=true;
   renderPlayers('');
   libraryRender();
   status('');
  }catch(err){status('Could not load the player directory or film library: '+err.message,true)}
  finally{loading=false}
 }
 async function save(publish){
  const id=extractVideoId(by('filmAdminUrl').value),title=by('filmAdminTitle').value.trim(),player=by('filmAdminPlayer').value;
  const desc=by('filmAdminDescription').value.trim();
  if(!id)return status('Enter a valid YouTube video URL first.',true);
  if(title.length<5||title.length>200)return status('Video title must be between 5 and 200 characters.',true);
  if(!player)return status('Select the matching BBB player.',true);
  if(publish&&!by('filmAdminConfirm').checked)return status('Confirm this is a public, embeddable video from your channel before publishing.',true);
  const old=films.find(f=>f.youtube_video_id===id);
  if(old&&old.player_key!==player)return status('This video already belongs to '+(players.find(p=>p.player_key===old.player_key)?.name||old.player_key)+'. Edit the existing association before saving.',true);
  const btn=publish?by('filmAdminPublish'):by('filmAdminDraft');
  btn.disabled=true;btn.dataset.original=btn.textContent;btn.textContent=publish?'Publishing…':'Saving…';
  by('filmAdminDraft').disabled=true;by('filmAdminPublish').disabled=true;
  try{
   const result=await rpc('admin_save_film_breakdown',{
    p_video_id:id,p_player_key:player,p_title:title,
    p_video_type:by('filmAdminType').value,
    p_description:desc||null,p_approved:!!publish
   });
   await load(true);
   resetForm();
   status(publish?'Published! Video #'+result+' will appear in the Film Room and matched scouting profile when the updated website preview is deployed.':'Draft saved privately. It will not appear in the public Film Room.',false);
  }catch(err){status('Could not save video: '+err.message,true)}
  finally{by('filmAdminDraft').disabled=false;by('filmAdminPublish').disabled=false;btn.textContent=btn.dataset.original||btn.textContent}
 }
 function install(){
  const pageNode=by('pageFilm');
  if(!pageNode||pageNode.dataset.filmBound==='1')return;
  pageNode.dataset.filmBound='1';
  by('filmAdminForm').addEventListener('submit',e=>{e.preventDefault();void save(true)});
  by('filmAdminDraft').addEventListener('click',()=>void save(false));
  by('filmAdminInspect').addEventListener('click',()=>void inspect(false));
  by('filmAdminUrl').addEventListener('change',()=>void inspect(true));
  by('filmAdminReset').addEventListener('click',resetForm);
  by('filmAdminRefresh').addEventListener('click',()=>void load(true));
  by('filmAdminPlayerSearch').addEventListener('input',e=>renderPlayers(e.target.value));
  by('filmAdminPlayer').addEventListener('change',e=>{if(!editing)recommendType(e.target.value)});
  by('filmAdminLibrarySearch').addEventListener('input',libraryRender);
  by('filmAdminLibraryStatus').addEventListener('change',libraryRender);
  const nav=document.querySelector('[data-page="film"]');
  nav?.addEventListener('click',()=>page('film'));
 }
 if(typeof page==='function'){
  const original=page;
  page=function(name){
   original.apply(this,arguments);
   if(name==='film'){
    if(by('missionPageTitle'))by('missionPageTitle').textContent='Film Breakdown Manager';
    if(!loaded&&!loading)void load();else libraryRender();
   }
  };
 }
 try{
  if(typeof ADMIN_COMMANDS!=='undefined'&&!ADMIN_COMMANDS.some(x=>x.id==='film')){
   ADMIN_COMMANDS.splice(5,0,{id:'film',icon:'▣',label:'Film Breakdown Manager',sub:'Paste a YouTube link, match the player and publish',tag:'PAGE'});
  }
 }catch(_){}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
 else install();
 window.BBBAdminFilms={load,extractVideoId};
})();
