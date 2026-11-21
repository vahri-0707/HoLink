import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { assetUrl } from '../src/paths.js';
import { buildPages } from '../scripts/build-pages.mjs';

test('saved assets work under a GitHub Pages project path and a localhost root',()=>{
  const asset='/assets/illustrations/studio-blue.svg';
  assert.equal(assetUrl(asset,new URL('https://vahri-0707.github.io/HoLink/')),'https://vahri-0707.github.io/HoLink/assets/illustrations/studio-blue.svg');
  assert.equal(assetUrl('/assets/audio/studio-ambient.wav',new URL('http://localhost:5173/')),'http://localhost:5173/assets/audio/studio-ambient.wav');
});

test('remote media and the canonical saved asset value remain unchanged',()=>{
  const media='https://example.com/portfolio.jpg?size=800';
  assert.equal(assetUrl(media,new URL('https://vahri-0707.github.io/HoLink/')),media);
  const saved='/assets/icons/link.svg';
  assetUrl(saved,new URL('https://vahri-0707.github.io/HoLink/'));
  assert.equal(saved,'/assets/icons/link.svg');
});

test('the production artifact contains a complete browser app without the development server',async()=>{
  const temporary=await mkdtemp(path.join(os.tmpdir(),'holink-pages-'));
  try {
    const destination=await buildPages(path.join(temporary,'dist'));
    const html=await readFile(path.join(destination,'index.html'),'utf8');
    assert.doesNotMatch(html,/holink-development/);
    await access(path.join(destination,'.nojekyll'));
    await access(path.join(destination,'src/vendor/qrcode.js'));
    await access(path.join(destination,'src/vendor/LICENSE-qrcode.txt'));
    for(const reference of html.matchAll(/\b(?:src|href)="([^"#][^"]*)"/g)) {
      assert.ok(reference[1].startsWith('./'),`Relative document asset: ${reference[1]}`);
      await access(path.resolve(destination,reference[1]));
    }
    for(const filename of await readdir(path.join(destination,'src'))) {
      if(!filename.endsWith('.js')) continue;
      const code=await readFile(path.join(destination,'src',filename),'utf8');
      for(const reference of code.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        await access(path.resolve(destination,'src',reference[1]));
      }
    }
    const css=await readFile(path.join(destination,'styles/tokens.css'),'utf8');
    for(const reference of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) {
      await access(path.resolve(destination,'styles',reference[1]));
    }
    for(const excluded of ['server.mjs','scripts','screenshots','tests']) {
      await assert.rejects(access(path.join(destination,excluded)));
    }
  } finally { await rm(temporary,{recursive:true,force:true}); }
});
