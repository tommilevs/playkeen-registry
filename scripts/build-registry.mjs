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
    const releases=(await github(`https://api.github.com/repos/${repo.full_name}/releases?per_page=20`).catch(()=>[]));
    const release=(releases.find(item=>!item.draft)||null);
    if(!release) continue;
    const text=await manifestResponse.text();
    const id=(text.match(/^id:\s*([^\s#]+)/m)||[])[1];
    const name=(text.match(/^name:\s*(.+)$/m)||[])[1]?.trim();
    const type=(text.match(/^type:\s*(\S+)/m)||[])[1]||'bash';
    const packageName=(text.match(/^package_name:\s*(\S+)/m)||[])[1]||null;
    const architectures=(text.match(/^architectures:\s*\[([^\]]+)\]/m)||[])[1]?.split(',').map(x=>x.trim())||[];
    if(!id||!name||!architectures.length) continue;
    const archive=release.assets?.find(x=>type==='opkg'?/\.ipk$/i.test(x.name):/\.(tar\.gz|tgz|zip)$/i.test(x.name));
    const checksum=release.assets?.find(x=>/(sha256|sha256sum|\.sha256)$/i.test(x.name));
    let sha256;
    if (checksum) {
      const checksumText=await (await fetch(checksum.browser_download_url,{headers})).text();
      sha256=(checksumText.match(/[a-f0-9]{64}/i)||[])[0]?.toLowerCase();
    }
    const terminalEnabled=/^\s+enabled:\s*true\s*$/m.test(text) && /^terminal:\s*$/m.test(text);
    apps.push({id,name,type,package_name:packageName,repository:repo.html_url,release:release.tag_name,release_url:release.html_url,package_url:archive?.browser_download_url||null,sha256:sha256||null,architectures,description:repo.description||'',terminal:terminalEnabled?{enabled:true,provider:(text.match(/^\s+provider:\s*(\S+)/m)||[])[1]||'ttyd'}:null});
  } catch (error) { console.error(`skip ${repo.full_name}: ${error.message}`); }
}
apps.sort((a,b)=>a.id.localeCompare(b.id));
await fs.writeFile('registry/index.json',JSON.stringify({schema:'playkeen/registry-v1',generated_at:new Date().toISOString(),apps},null,2)+'\n');
console.log(`indexed ${apps.length} applications`);
