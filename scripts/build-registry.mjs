import fs from 'node:fs/promises';

const token = process.env.GITHUB_TOKEN;
const headers = {'User-Agent':'playkeen-registry-bot','Accept':'application/vnd.github+json'};
if (token) headers.Authorization = `Bearer ${token}`;
async function github(url){const r=await fetch(url,{headers});if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json();}
const query = process.env.PLAYKEEN_GITHUB_QUERY || 'keenplay- in:name';
const repos = (await github(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=100`)).items || [];
const apps=[];
for(const repo of repos){
  try {
    const manifestResponse=await fetch(`https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/playkeen.yaml`,{headers});
    if(!manifestResponse.ok) continue;
    const release=(await github(`https://api.github.com/repos/${repo.full_name}/releases/latest`).catch(()=>null));
    if(!release) continue;
    const text=await manifestResponse.text();
    const id=(text.match(/^id:\s*([^\s#]+)/m)||[])[1];
    const name=(text.match(/^name:\s*(.+)$/m)||[])[1]?.trim();
    const architectures=(text.match(/^architectures:\s*\[([^\]]+)\]/m)||[])[1]?.split(',').map(x=>x.trim())||[];
    if(!id||!name||!architectures.length) continue;
    apps.push({id,name,repository:repo.html_url,release:release.tag_name,release_url:release.html_url,architectures,description:repo.description||''});
  } catch (error) { console.error(`skip ${repo.full_name}: ${error.message}`); }
}
apps.sort((a,b)=>a.id.localeCompare(b.id));
await fs.writeFile('registry/index.json',JSON.stringify({schema:'playkeen/registry-v1',generated_at:new Date().toISOString(),apps},null,2)+'\n');
console.log(`indexed ${apps.length} applications`);

