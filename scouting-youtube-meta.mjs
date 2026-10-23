/* YouTube public oEmbed metadata proxy; strict video ID whitelist prevents arbitrary URL fetches. */
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Cache-Control','public, max-age=300, s-maxage=3600');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
 let id='';
 try{id=new URL(req.url,'https://bbb.invalid').searchParams.get('id')||''}catch{}
 if(!/^[A-Za-z0-9_-]{11}$/.test(id))return res.status(400).json({error:'Invalid YouTube video ID'});
 const endpoint=new URL('https://www.youtube.com/oembed');
 endpoint.searchParams.set('url','https://www.youtube.com/watch?v='+id);
 endpoint.searchParams.set('format','json');
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
  let response;
  try{response=await fetch(endpoint.toString(),{signal:controller.signal,headers:{accept:'application/json','user-agent':'BobbysBigBoard/1.0'}})}
  finally{clearTimeout(timer)}
  if(!response.ok)return res.status(response.status===404?404:502).json({error:response.status===404?'Video unavailable or not embeddable':'YouTube metadata temporarily unavailable'});
  const data=await response.json();
  const title=String(data.title||'').trim().slice(0,200);
  const author=String(data.author_name||'').trim().slice(0,120);
  if(!title)return res.status(502).json({error:'No title returned by YouTube'});
  return res.status(200).json({id,title,channel:author,author_url:String(data.author_url||'').slice(0,400),provider:'YouTube',thumbnail:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'});
 }catch(_){return res.status(503).json({error:'YouTube title lookup unavailable. Enter the title manually.'})}
}
