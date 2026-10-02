// Fetch public official pages directly; no paid scraping or model service.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const base='.firecrawl/profile-enrichment-20260912';
const out='.firecrawl/overview-editorial-20260913/direct-fetch';
mkdirSync(out,{recursive:true});
const rows=JSON.parse(readFileSync(base+'/inputs.json','utf8'));
const extra=new Set(['bartlett-hockey','advocate-athlete','bishop-sports','groupe-smart-hockey','ice-exposure-consulting-inc','cutting-edge-management']);
const jobs=rows.filter(r=>!r.pages.length||extra.has(r.slug));
async function fetchPage(url){
 const res=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'HockeyDirectoryResearch/1.0 (public company profile research)'}});
 if(!res.ok)throw Error('HTTP '+res.status);
 const html=await res.text();const dom=new JSDOM(html,{url:res.url});const d=dom.window.document;
 const links=[...d.querySelectorAll('a[href]')].map(a=>({url:a.href,label:a.textContent})).filter(a=>/about|services|who we|home/i.test(a.label+' '+a.url)&&new URL(a.url).hostname===new URL(res.url).hostname);
 d.querySelectorAll('script,style,noscript,nav,footer,header,form,svg').forEach(e=>e.remove());
 d.querySelectorAll('p,h1,h2,h3,h4,li,section,div,br').forEach(e=>e.append(d.createTextNode('\n')));
 const text=(d.body?.textContent||'').split('\n').map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean).join('\n').slice(0,65000);
 dom.window.close();return {url:res.url,captured_at:new Date().toISOString(),text,links};
}
async function run(r){
 const url=r.website_url?.replace(/^https:\/\/Http:\/\//i,'https://');
 const result={slug:r.slug,pages:[],issues:[]};
 try{
 if(!url||/facebook.com/i.test(url))throw Error('No accessible standalone official website supplied');
 const first=await fetchPage(url);result.pages.push(first);
 const urls=[...new Set(first.links.map(l=>l.url))].filter(u=>u!==first.url&&!/#|privacy|terms|careers|jobs/i.test(u)).slice(0,2);
 for(const u of urls){try{result.pages.push(await fetchPage(u));}catch(e){result.issues.push(u+': '+e.message);}}
 }catch(e){result.issues.push(e.message);}
 writeFileSync(out+'/'+r.slug+'.json',JSON.stringify(result,null,2));
 console.log(r.slug+': '+result.pages.length+' pages '+result.issues.join('; '));
}
let next=0;await Promise.all([0,1,2].map(async()=>{while(next<jobs.length)await run(jobs[next++]);}));
