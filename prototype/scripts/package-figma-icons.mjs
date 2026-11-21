import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(await readFile(path.join(root,'assets/icons/manifest.json'),'utf8'));
const script=await readFile(path.resolve(root,'../figma-design/migrate-icon-family.js'),'utf8');
const assets=await Promise.all(Object.entries(manifest.icons).map(async([name,pair],index)=>({name,index,outlineId:pair.outline,filledId:pair.filled,outline:await readFile(path.join(root,'assets/icons',name+'.svg'),'utf8'),filled:await readFile(path.join(root,'assets/icons',name+'-fill.svg'),'utf8')})));
await mkdir('/private/tmp/holink-figma-icon-batches',{recursive:true});
for(let i=0;i<assets.length;i+=7){const file=`/private/tmp/holink-figma-icon-batches/batch-${i/7}.js`;const source=`const ASSETS=${JSON.stringify(assets.slice(i,i+7))};\n${script}`;if(Buffer.byteLength(source)>63000)throw Error('Figma batch too large.');await writeFile(file,source);console.log(file);}
