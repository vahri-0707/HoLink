import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../figma-design/',import.meta.url));
const ledger=JSON.parse(await readFile(path.join(root,'state.json'),'utf8'));
let source=`const LEDGER=${JSON.stringify(ledger)};\n`;
for(const file of ['runtime.js','organism-helpers.js','navigation-refinement.js'])source+='\n'+await readFile(path.join(root,file),'utf8');
await writeFile('/private/tmp/holink-figma-navigation.js',source);
console.log(`Prepared navigation refinement (${Buffer.byteLength(source)} bytes).`);
