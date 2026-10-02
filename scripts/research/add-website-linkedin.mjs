// Run with node --experimental-strip-types scripts/research/add-website-linkedin.mjs
// Candidate selection was reviewed against the official website captures. No network calls.
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {linkedInProfileUrl,professionalLinkedInUrl} from '../../lib/research/company-research.ts'
const base='.firecrawl/profile-enrichment-20260912',work='.firecrawl/overview-editorial-20260913'
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const records=read(base+'/inputs.json'),candidates=read(work+'/linkedin-candidates.json'),selected=read(work+'/linkedin-selections.json')
const key=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'')
const visible=s=>s.replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/https?:\/\/\S+/g,'')
const host=u=>new URL(u).hostname.replace(/^www\./,'')
const added=[],skipped=[],changed=new Map()
for(const [i,c]of candidates.entries()){
 const name=selected.people[i],company=selected.companies.includes(i)
 if(!name&&!company){skipped.push({...c,reason:'Not selected: article, template/vendor, external partner, duplicate, or ambiguous identity.'});continue}
 const r=records.find(r=>r.slug===c.slug),path=base+'/results/'+r.slug+'.json'
 if(!existsSync(path)){skipped.push({...c,reason:'Company identity/source review still unresolved.'});continue}
 const url=company?linkedInProfileUrl(c.url):professionalLinkedInUrl(c.url)
 if(!url)throw Error('Invalid profile URL '+c.url)
 const page=r.pages.find(p=>p.url===c.source_url&&p.text.includes(c.url))
 if(!page||host(page.url)!==host(r.website_url))throw Error('Missing first-party source '+c.slug)
 const namePage=name?r.pages.find(p=>host(p.url)===host(r.website_url)&&key(visible(p.text)).includes(key(name))):null
 if(name&&!namePage){skipped.push({...c,reason:'Personal link found, but the full name could not be corroborated in visible official website text.'});continue}
 const d=changed.get(path)||read(path)
 const evidence={source_url:c.source_url,quote:c.url}
 if(company)d.company_linkedin={url,...evidence}
 else{
  const existing=d.team.find(p=>key(p.name)===key(name))
  if(existing){existing.linkedin_url=url;existing.source_url=c.source_url;existing.quote=c.url}
  else d.team.push({name,title:null,bio:null,linkedin_url:url,...evidence,name_source_url:namePage.url})
 }
 changed.set(path,d);added.push({slug:r.slug,name:company?r.name:name,kind:company?'company':'person',url,...evidence})
}
for(const [path,d]of changed)writeFileSync(path,JSON.stringify(d,null,2)+'\n')
const summary={companies_with_links:changed.size,company_links:added.filter(a=>a.kind==='company').length,personal_links:added.filter(a=>a.kind==='person').length,skipped:skipped.length}
writeFileSync('data/enrichment/linkedin-review-20260913.json',JSON.stringify({summary,added,skipped},null,2))
console.log(JSON.stringify(summary,null,2))
for(const s of skipped.filter(s=>s.reason.startsWith('Personal')))console.log(s.slug,s.url,s.reason)
