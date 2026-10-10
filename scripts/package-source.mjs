import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';

const { version } = JSON.parse(await fs.readFile('package.json', 'utf8'));
const included = [
  'src', 'desktop', 'public', 'tests', 'scripts', 'src-tauri', 'docs', 'examples',
  'third-party-licenses', '.github', '.gitignore', '.nvmrc', 'package.json', 'package-lock.json',
  'tsconfig.json', 'vite.config.ts', 'index.html', 'icon.png', 'icon.ico',
  'README.md', 'README.zh-CN.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'CHANGELOG.md', 'CONTRIBUTING.md',
];
const zip = new JSZip();
async function add(relative) {
  if (relative === 'tests/.ui-build.mjs' || relative.endsWith('.tsbuildinfo')) return;
  const stat = await fs.lstat(relative);
  if (stat.isSymbolicLink()) throw Error('Source export does not accept symbolic links');
  if (stat.isDirectory()) {
    for (const entry of (await fs.readdir(relative)).sort()) await add(`${relative}/${entry}`);
  } else if (stat.isFile()) zip.file(`CanvasNote/${relative}`, await fs.readFile(relative));
}
for (const entry of included) await add(entry);
await fs.mkdir('release', { recursive: true });
const output = path.resolve('release', `CanvasNote-v${version}-Source.zip`);
await fs.writeFile(output, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } }));
console.log('Packaged', output);
