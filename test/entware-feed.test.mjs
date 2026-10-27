import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePackages, markVerified, ENTWARE_FEEDS} from '../scripts/entware-feed.mjs';

test('parses only safe package stanzas and verifies matching GitHub-curated architecture',()=>{
  const packages=parsePackages('Package: curl\nVersion: 8.1-1\nArchitecture: aarch64-3.10\nSection: net\nDescription: Transfer data\n  over URLs\nFilename: curl_8.1-1_aarch64-3.10.ipk\nSize: 10\n\nPackage: wget\nVersion: 1.2-1\nArchitecture: aarch64-3.10\nFilename: wget_1.2-1_aarch64.ipk\nDescription: Downloader\n\nPackage: ../bad\nVersion: 1\nArchitecture: aarch64-3.10\nFilename: bad.ipk\n\nPackage: unsafe\nVersion: 1\nArchitecture: aarch64-3.10\nFilename: ../unsafe.ipk\n', 'aarch64-k3.10');
  assert.deepEqual(packages.map(({package_name,version,feed_architecture,feed,section,description,filename,size})=>({package_name,version,architecture:feed_architecture,feed,section,description,filename,size})),[
    {package_name:'curl',version:'8.1-1',architecture:'aarch64-3.10',feed:'aarch64-k3.10',section:'net',description:'Transfer data over URLs',filename:'curl_8.1-1_aarch64-3.10.ipk',size:10},
    {package_name:'wget',version:'1.2-1',architecture:'aarch64-3.10',feed:'aarch64-k3.10',section:'',description:'Downloader',filename:'wget_1.2-1_aarch64.ipk',size:null}
  ]);
  assert.deepEqual(markVerified(packages,[{package_name:'curl',architectures:['arm64']},{package_name:'wget',architectures:['amd64']}]).map(x=>x.verified),[true,false]);
  const universal=parsePackages('Package: app\nVersion: 1\nArchitecture: all\nFilename: app_1_all.ipk\n','aarch64-k3.10')[0];
  const universalOtherFeed={...universal,feed:'x64-k3.2'};
  assert.deepEqual(markVerified([universal,universalOtherFeed],[{package_name:'app',architectures:['arm64']}]).map(x=>x.verified),[true,false]);
  assert.equal(ENTWARE_FEEDS.find(([feed])=>feed==='armv7sf-k2.6')[1],'armv7-k2.6');
});
