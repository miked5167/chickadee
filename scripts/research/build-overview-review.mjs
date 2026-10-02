// Validate all editorial records and build a local review bundle. No network calls.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
const base='.firecrawl/profile-enrichment-20260912', work='.firecrawl/overview-editorial-20260913', out='data/enrichment'
const records=JSON.parse(readFileSync(base+'/inputs.json','utf8'))
const clean=s=>String(s).replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[*_#\\]/g,'').replace(/\s+/g,' ').trim().toLowerCase()
const host=u=>new URL(u).hostname.replace(/^www\./,'')
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const special={
 'c20-hockey':'The supplied Facebook URL names Creative Artists Agency rather than C20 Hockey. Confirm the company identity and official website.',
 'hpa-sports-management':'The directory website is malformed (https://Http://...). The corrected domain could not be retrieved. Confirm the official website.',
 'black-aces-sports-management':'Only an Instagram login page was accessible. No substantive official company description could be retrieved.',
 'pci-hockey':'The supplied procounsel.ca contact page points to pci.hockey, where substantive company information is available. Update/confirm the directory website before using the new domain as profile evidence.',
}
const review=[]
for(const r of records){
 const path=base+'/results/'+r.slug+'.json', issuePath=work+'/'+r.slug+'.issue.json'
 if(existsSync(path)){
  const d=JSON.parse(readFileSync(path,'utf8'))
  if(d.company_id!==r.id||d.slug!==r.slug||host(d.website_url)!==host(r.website_url))throw Error('Identity mismatch '+r.slug)
  if(!d.overview.length||d.overview.some(f=>!f.text.trim()))throw Error('Empty '+r.slug)
  for(const f of [...d.overview, ...d.team, ...(d.company_linkedin ? [d.company_linkedin] : [])]){
   if(!d.sources.some(s=>s.url===f.source_url)||host(f.source_url)!==host(r.website_url))throw Error('Source domain mismatch '+r.slug)
   if(!r.pages.some(p=>p.url===f.source_url&&(p.text.includes(f.quote)||clean(p.text).includes(clean(f.quote)))))throw Error('Evidence mismatch '+r.slug)
  }
  const word_count=d.overview.map(f=>f.text).join(' ').split(/\s+/).length
  if(word_count>350)throw Error('Word count '+r.slug)
  d.word_count=word_count
  review.push({company_id:r.id,slug:r.slug,name:r.name,website_url:r.website_url,status:'draft',word_count,overview:d.overview.map(f=>f.text).join('\n\n'),source_urls:[...new Set(d.overview.map(f=>f.source_url))],issue:'',draft:d})
 }else{
  let issue=special[r.slug]||(existsSync(issuePath)?JSON.parse(readFileSync(issuePath)).issue:null)
  if(!issue){
   if(!r.website_url)issue='No official website supplied in the directory. Needs an identified official source before an overview can be written.'
   else if(/facebook\.com|instagram\.com/.test(r.website_url))issue='Only a social-media URL is supplied; accessible official company text was not available for this pass.'
   else issue='No usable company text was available from the saved sources or free retrieval attempts. Confirm the website or provide official company material.'
  }
  writeFileSync(issuePath,JSON.stringify({slug:r.slug,name:r.name,website_url:r.website_url,issue},null,2)+'\n')
  review.push({company_id:r.id,slug:r.slug,name:r.name,website_url:r.website_url,status:'needs_source_review',word_count:0,overview:'',source_urls:[],issue})
 }
}
mkdirSync(out,{recursive:true})
const drafted=review.filter(r=>r.status==='draft'), flags=review.filter(r=>r.status!=='draft')
const counts={total:review.length,drafted:drafted.length,needs_source_review:flags.length,additional_paid_scraping_calls:0,additional_paid_model_api_calls:0,words:drafted.reduce((s,r)=>s+r.word_count,0)}
const date='20260913'
writeFileSync(out+'/company-overview-review-'+date+'.json',JSON.stringify({created_at:new Date().toISOString(),counts,scope:'Local overview drafts only; no Supabase writes or deployment.',records:review},null,2))
const columns=['name','slug','status','word_count','overview','website_url','source_urls','issue']
const csv=v=>'"'+String(Array.isArray(v)?v.join('\n'):v??'').replaceAll('"','""')+'"'
writeFileSync(out+'/company-overview-review-'+date+'.csv','\uFEFF'+[columns.map(csv).join(','),...review.map(r=>columns.map(k=>csv(r[k])).join(','))].join('\r\n'))
const cards=review.map(r=>'<article data-status="'+r.status+'" data-name="'+esc(r.name.toLowerCase())+'"><div class="row"><h2>'+esc(r.name)+'</h2><span class="tag '+(r.status==='draft'?'draft':'issue')+'">'+(r.status==='draft'?r.word_count+' words':'Needs source review')+'</span></div>'+(r.status==='draft'?r.draft.overview.map(f=>'<p>'+esc(f.text)+'</p>').join(''):'<p class="reason">'+esc(r.issue)+'</p>')+'<div class="links"><a href="/listings/'+encodeURIComponent(r.slug)+'#overview" target="_blank" rel="noopener noreferrer">Open profile ↗</a>'+r.source_urls.map((u,i)=>'<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">Website source '+(i+1)+' ↗</a>').join('')+'</div></article>').join('\n')
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Company overview review · Hockey Directory</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f6f8;color:#142039;font:16px/1.65 system-ui,sans-serif}main{max-width:1000px;margin:auto;padding:40px 22px}h1{font-size:34px;line-height:1.2;margin:10px 0}h2{font-size:21px;margin:0}.intro{max-width:750px;color:#536078}.stats{display:flex;gap:14px;flex-wrap:wrap;margin:26px 0}.stat{background:#142039;color:white;padding:18px 24px;border-radius:12px;flex:1;min-width:160px}.stat strong{font-size:30px;display:block}.filters{position:sticky;top:0;background:#f5f6f8;padding:14px 0;display:flex;flex-wrap:wrap;gap:12px;z-index:1}input,select{font:inherit;padding:12px;border:1px solid #b5c0d0;border-radius:8px;min-height:48px}input{flex:1;min-width:200px}article{padding:26px;background:white;border:1px solid #dde3ea;border-radius:12px;margin:16px 0}.row{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.tag{font-size:13px;padding:4px 10px;border-radius:24px;white-space:nowrap}.draft{background:#e4f2ed;color:#166044}.issue{background:#fff0d3;color:#855400}.reason{color:#705223}.links{display:flex;gap:20px;flex-wrap:wrap;font-size:14px}a{color:#175b9b}a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #d67c1c;outline-offset:3px}[hidden]{display:none!important}.eyebrow{font-size:12px;letter-spacing:2px;font-weight:700;color:#64708a}@media(max-width:500px){main{padding:24px 14px}h1{font-size:28px}article{padding:20px}}</style></head><body><main><div class="eyebrow">HOCKEY DIRECTORY · LOCAL REVIEW</div><h1>Company overviews</h1><p class="intro">Original drafts based on official website material. These are local previews awaiting editorial review; they have not been saved to Supabase or published. Short descriptions reflect limited source material.</p><div class="stats"><div class="stat"><strong>'+counts.total+'</strong>companies reviewed</div><div class="stat"><strong>'+counts.drafted+'</strong>draft overviews</div><div class="stat"><strong>'+counts.needs_source_review+'</strong>need source review</div></div><div class="filters"><input id="search" type="search" aria-label="Search companies" placeholder="Search company names"><select id="filter" aria-label="Filter status"><option value="">All companies</option><option value="draft">Draft overviews</option><option value="needs_source_review">Needs source review</option></select></div><p id="shown" aria-live="polite">'+counts.total+' companies shown</p>'+cards+'<p id="empty" hidden>No companies match this search.</p></main><script>const search=document.getElementById("search"),filter=document.getElementById("filter");function update(){let n=0;for(const a of document.querySelectorAll("article")){const show=a.dataset.name.includes(search.value.toLowerCase().trim())&&(!filter.value||a.dataset.status===filter.value);a.hidden=!show;if(show)n++}document.getElementById("shown").textContent=n+" companies shown";document.getElementById("empty").hidden=n!==0}search.addEventListener("input",update);filter.addEventListener("change",update);</script></body></html>'
writeFileSync(out+'/company-overview-review-'+date+'.html',html)
console.log(JSON.stringify(counts,null,2))
