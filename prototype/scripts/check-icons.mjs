import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const directories=[path.join(root,'assets/icons'),path.resolve(root,'../figma-design/assets/icons')];
const manifest=JSON.parse(await readFile(path.join(directories[0],'manifest.json'),'utf8'));
const expected=[];
for(const[name,pair]of Object.entries(manifest.icons)){
  if(!pair.outline.startsWith('ph:')||!pair.filled.startsWith('ph:')||!pair.filled.endsWith('-fill'))throw Error(`Inconsistent family: ${name}`);
  for(const suffix of ['','-fill']){
    const filename=name+suffix+'.svg';expected.push(filename);
    const copies=await Promise.all(directories.map(dir=>readFile(path.join(dir,filename),'utf8')));
    if(copies[0]!==copies[1])throw Error(`Prototype/Figma asset mismatch: ${filename}`);
    if(!copies[0].includes('viewBox="0 0 256 256"')||!copies[0].includes('width="24"')||/script|foreignObject|stroke-width=/i.test(copies[0]))throw Error(`Unexpected icon geometry: ${filename}`);
  }
}
for(const dir of directories){const actual=(await readdir(dir)).filter(f=>f.endsWith('.svg'));if(actual.length!==expected.length||actual.some(f=>!expected.includes(f)))throw Error(`Unexpected SVG in ${dir}`);}
console.log(`${expected.length} verified local SVGs / ${Object.keys(manifest.icons).length} matched pairs / one Regular outline weight / identical prototype and Figma assets.`);
