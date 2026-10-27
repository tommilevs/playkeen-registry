import fs from 'node:fs/promises';
import {ENTWARE_FEEDS,loadEntwarePackages,markVerified} from './entware-feed.mjs';

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
    const version=(text.match(/^version:\s*([^\s#]+)/m)||[])[1]||release.tag_name;
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
    apps.push({id,name,version,type,package_name:packageName,repository:repo.html_url,release:release.tag_name,release_url:release.html_url,package_url:archive?.browser_download_url||null,sha256:sha256||null,architectures,description:repo.description||'',terminal:terminalEnabled?{enabled:true,provider:(text.match(/^\s+provider:\s*(\S+)/m)||[])[1]||'ttyd'}:null});
  } catch (error) { console.error(`skip ${repo.full_name}: ${error.message}`); }
}
const curated=JSON.parse(await fs.readFile('registry/curated.json','utf8'));
if(curated.schema!=='playkeen/curated-v1'||!Array.isArray(curated.apps))throw new Error('Invalid curated catalog');
for(const item of curated.apps){
  if(!/^[a-z0-9][a-z0-9._-]*$/.test(item.id)||!/^[\w.-]+\/[\w.-]+$/.test(item.repository)||!item.package_name||!item.asset_suffix||!Array.isArray(item.architectures)||!item.architectures.length)throw new Error(`Invalid curated package: ${item.id}`);
  if(apps.some(app=>app.id===item.id))throw new Error(`Duplicate application id: ${item.id}`);
  const releases=await github(`https://api.github.com/repos/${item.repository}/releases?per_page=20`);
  const release=releases.find(x=>!x.draft&&!x.prerelease);
  const asset=release?.assets?.find(x=>x.name.endsWith(item.asset_suffix));
  const sha256=asset?.digest?.match(/^sha256:([a-f0-9]{64})$/i)?.[1]?.toLowerCase();
  if(!release||!asset||!sha256||!asset.browser_download_url?.startsWith(`https://github.com/${item.repository}/releases/download/`))throw new Error(`No verified release asset for ${item.id}`);
  apps.push({id:item.id,name:item.name,version:release.tag_name.replace(/^v/i,''),type:'opkg',source:'github-curated',verified:true,package_name:item.package_name,repository:`https://github.com/${item.repository}`,release:release.tag_name,release_url:release.html_url,package_url:asset.browser_download_url,sha256,architectures:item.architectures,description:item.description||'',terminal:null});
}
const adapters=JSON.parse(await fs.readFile('registry/adapters.json','utf8').catch(()=>'{"schema":"playkeen/adapters-v1","apps":[]}'));
if(adapters.schema!=='playkeen/adapters-v1'||!Array.isArray(adapters.apps))throw new Error('Invalid adapter catalog');
for(const item of adapters.apps){
  if(!/^[a-z0-9][a-z0-9._-]*$/.test(item.id)||!/^[\w.-]+\/[\w.-]+$/.test(item.repository)||!/^apps\/[\w./-]+\/playkeen\.yaml$/.test(item.manifest_path)||!Array.isArray(item.architectures)||!item.architectures.length)throw new Error(`Invalid adapter: ${item.id}`);
  const manifestResponse=await fetch(`https://raw.githubusercontent.com/${item.repository}/main/${item.manifest_path}`,{headers});
  if(!manifestResponse.ok)throw new Error(`Adapter manifest unavailable: ${item.id}`);
  const text=await manifestResponse.text();
  const id=(text.match(/^id:\s*([^\s#]+)/m)||[])[1];
  const name=(text.match(/^name:\s*(.+)$/m)||[])[1]?.trim();
  const version=(text.match(/^version:\s*([^\s#]+)/m)||[])[1];
  const type=(text.match(/^type:\s*(\S+)/m)||[])[1]||'hybrid';
  const architectures=(text.match(/^architectures:\s*\[([^\]]+)\]/m)||[])[1]?.split(',').map(x=>x.trim())||[];
  if(id!==item.id||!name||!version||!architectures.length)throw new Error(`Invalid adapter manifest: ${item.id}`);
  const releases=await github(`https://api.github.com/repos/${item.repository}/releases?per_page=20`);
  const release=releases.find(x=>!x.draft);
  const assetName=`${item.id}-${version}.tar.gz`;
  const asset=release?.assets?.find(x=>x.name===assetName);
  const sha256=asset?.digest?.match(/^sha256:([a-f0-9]{64})$/i)?.[1]?.toLowerCase();
  if(!release||!asset||!sha256)throw new Error(`No verified adapter release asset: ${item.id}`);
  const idx=apps.findIndex(app=>app.id===id);
  if(idx>=0)apps.splice(idx,1);
  apps.push({id,name,version,type,repository:`https://github.com/${item.repository}`,release:release.tag_name,release_url:release.html_url,package_url:asset.browser_download_url,sha256,architectures,description:item.description||'',terminal:null});
}
apps.sort((a,b)=>a.id.localeCompare(b.id));
const opkgPackages=markVerified(await loadEntwarePackages(),curated.apps);
const generatedAt=new Date().toISOString();
await fs.mkdir('registry/entware',{recursive:true});
const opkgFeeds=[];
for(const [feed,architecture] of ENTWARE_FEEDS){
  const packages=opkgPackages.filter(pkg=>pkg.feed===feed).sort((a,b)=>a.name.localeCompare(b.name));
  await fs.writeFile(`registry/entware/${feed}.json`,JSON.stringify({schema:'playkeen/entware-feed-v1',generated_at:generatedAt,feed,packages},null,2)+'\n');
  opkgFeeds.push({feed,architecture,url:`https://raw.githubusercontent.com/tommilevs/playkeen-registry/main/registry/entware/${feed}.json`,count:packages.length});
}
await fs.writeFile('registry/index.json',JSON.stringify({schema:'playkeen/registry-v1',generated_at:generatedAt,apps,opkg_feeds:opkgFeeds},null,2)+'\n');
console.log(`indexed ${apps.length} applications and ${opkgPackages.length} Entware packages in ${opkgFeeds.length} feeds`);
