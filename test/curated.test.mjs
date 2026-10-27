import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

test('indexes curated upstream opkg release with its verified asset digest',async()=>{
  const script=pathToFileURL(path.resolve('scripts/build-registry.mjs')).href;
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'playkeen-curated-'));
  const originalCwd=process.cwd(),originalFetch=globalThis.fetch;
  try {
    await fs.mkdir(path.join(tmp,'registry'));
    await fs.writeFile(path.join(tmp,'registry','curated.json'),JSON.stringify({schema:'playkeen/curated-v1',apps:[{id:'nfqws2-keenetic',name:'NFQWS2',repository:'nfqws/nfqws2-keenetic',package_name:'nfqws2-keenetic',asset_suffix:'_all_entware.ipk',architectures:['arm64'],description:'Native opkg package'}]}));
    globalThis.fetch=async url=>{
      const target=String(url);
      if(target.includes('/search/repositories'))return {ok:true,json:async()=>({items:[]})};
      if(target.includes('/repos/nfqws/nfqws2-keenetic/releases'))return {ok:true,json:async()=>[{draft:false,prerelease:false,tag_name:'v1.3.2',html_url:'https://github.com/nfqws/nfqws2-keenetic/releases/tag/v1.3.2',assets:[{name:'nfqws2-keenetic_1.3.2_all_entware.ipk',browser_download_url:'https://github.com/nfqws/nfqws2-keenetic/releases/download/v1.3.2/nfqws2-keenetic_1.3.2_all_entware.ipk',digest:`sha256:${'a'.repeat(64)}`}]}]};
      throw new Error(`Unexpected request: ${target}`);
    };
    process.chdir(tmp);await import(script);
    const result=JSON.parse(await fs.readFile(path.join(tmp,'registry','index.json'),'utf8'));
    assert.equal(result.apps.length,1);
    assert.equal(result.apps[0].id,'nfqws2-keenetic');
    assert.equal(result.apps[0].type,'opkg');
    assert.equal(result.apps[0].release,'v1.3.2');
    assert.equal(result.apps[0].sha256,'a'.repeat(64));
    assert.match(result.apps[0].package_url,/_all_entware\.ipk$/);
  } finally {process.chdir(originalCwd);globalThis.fetch=originalFetch;await fs.rm(tmp,{recursive:true,force:true});}
});
