import {readFileSync,writeFileSync} from 'node:fs'
const rows=JSON.parse(readFileSync('.firecrawl/profile-enrichment-20260912/inputs.json','utf8'))
const found=[]
for(const r of rows){
 const seen=new Set()
 for(const p of r.pages)for(const m of p.text.matchAll(/https?:\/\/(?:[a-z]+\.)?linkedin\.com\/[^\s)\]<>"\\]+/gi)){
  const url=m[0];if(seen.has(url))continue;seen.add(url)
  found.push({slug:r.slug,url,source_url:p.url,context:p.text.slice(Math.max(0,m.index-250),m.index+220)})
 }
}
writeFileSync('.firecrawl/overview-editorial-20260913/linkedin-candidates.json',JSON.stringify(found,null,2))
for(const f of found)console.log(JSON.stringify(f))
console.log(found.length+' unique links')
