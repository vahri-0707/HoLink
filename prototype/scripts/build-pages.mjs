import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../', import.meta.url));

/** Package the browser app only; keep development tooling out of the hosted site. */
export async function buildPages(destination = path.join(source, 'dist')) {
  destination = path.resolve(destination);
  if(path.basename(destination) !== 'dist') throw new Error('The static output directory must be named dist.');
  await rm(destination, { recursive:true, force:true });
  await mkdir(destination, { recursive:true });
  const html = await readFile(path.join(source, 'index.html'), 'utf8');
  const productionHtml = html.replace(/\s*<meta\s+name="holink-development"\s+content="true"\s*\/?>/, '');
  await writeFile(path.join(destination, 'index.html'), productionHtml);
  await writeFile(path.join(destination, '.nojekyll'), '');
  for(const directory of ['src','styles','assets']) {
    await cp(path.join(source, directory), path.join(destination, directory), { recursive:true });
  }
  return destination;
}

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Static site ready: ${await buildPages()}`);
}
