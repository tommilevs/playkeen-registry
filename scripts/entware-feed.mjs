import {gunzipSync} from 'node:zlib';

export const ENTWARE_FEEDS=[
  ['aarch64-k3.10','arm64'],['armv5sf-k3.2','arm'],['armv7sf-k2.6','armv7-k2.6'],
  ['armv7sf-k3.2','armv7-k3.2'],['mipselsf-k3.4','mipsel'],['mipssf-k3.4','mips'],
  ['x64-k3.2','amd64'],['x86-k2.6','x86']
];

export function parsePackages(text,feed){
  return String(text).split(/\r?\n\r?\n/).map(block=>{
    const fields={};let last='';
    for(const line of block.split(/\r?\n/)){
      if(/^\s/.test(line)&&last){fields[last]+=` ${line.trim()}`;continue;}
      const match=line.match(/^([A-Za-z0-9-]+):\s*(.*)$/);if(match){last=match[1];fields[last]=match[2];}
    }
    if(!/^[a-z0-9][a-z0-9+._-]{0,127}$/i.test(fields.Package||'')||!fields.Version||!fields.Architecture||!/^[a-z0-9][a-z0-9._+-]{0,63}$/i.test(fields.Architecture)||!/^[-a-zA-Z0-9+._]+\.ipk$/.test(fields.Filename||''))return null;
    const architecture=fields.Architecture;
    const architectures=architecture==='all'?['all']:[ENTWARE_FEEDS.find(([name])=>name===feed)?.[1]||'unknown'];
    return {id:`entware-${fields.Package}-${feed}`.toLowerCase().replace(/[^a-z0-9-]/g,'-'),name:fields.Package,package_name:fields.Package,version:fields.Version,release:fields.Version,type:'opkg',source:'entware',verified:false,repository:`https://bin.entware.net/${feed}/`,feed,feed_architecture:architecture,architectures,section:fields.Section||'',description:fields.Description||'',filename:fields.Filename||'',size:Number(fields.Size)||null,package_url:null,sha256:null};
  }).filter(Boolean);
}

export function markVerified(packages,curated){
  const feedArchitecture=new Map(ENTWARE_FEEDS);
  return packages.map(item=>({...item,verified:curated.some(approved=>approved.package_name===item.package_name&&approved.architectures.some(arch=>
    arch===feedArchitecture.get(item.feed)||(arch==='armv7'&&feedArchitecture.get(item.feed)?.startsWith('armv7-k'))
  ))}));
}

export async function loadEntwarePackages(fetcher=fetch){
  const feeds=await Promise.all(ENTWARE_FEEDS.map(async([feed])=>{
    const response=await fetcher(`https://bin.entware.net/${feed}/Packages.gz`);
    if(!response.ok)throw new Error(`Entware feed unavailable: ${feed} (${response.status})`);
    const data=Buffer.from(await response.arrayBuffer());
    return parsePackages(gunzipSync(data).toString('utf8'),feed);
  }));
  return feeds.flat();
}
