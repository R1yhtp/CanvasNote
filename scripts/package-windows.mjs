import { downloadArtifact } from '@electron/get';
import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';

const runtimeVersion = '44.7.0';
const { version } = JSON.parse(await fs.readFile('package.json', 'utf8'));
const release = path.resolve('release');
await fs.mkdir(release, { recursive: true });
const staging = await fs.mkdtemp(path.join(release, '.canvasnote-build-'));
const root = path.join(release, 'CanvasNote-Windows-x64');
const output = path.join(release, `CanvasNote-v${version}-Windows-x64.zip`);
const temporaryZip = path.join(release, `${path.basename(staging)}.zip`);

try {
  const suppliedRuntime = process.env.CANVASNOTE_RUNTIME_DIR;
  if (suppliedRuntime) {
    const source = path.resolve(suppliedRuntime);
    const oldApp = path.join(source, 'resources', 'app');
    console.log('Using local Windows x64 runtime');
    await fs.cp(source, staging, {
      recursive: true,
      filter: entry => entry !== oldApp && !entry.startsWith(oldApp + path.sep)
        && entry !== path.join(source, 'resources', 'app.asar'),
    });
  } else {
    console.log('Downloading official Electron Windows runtime', runtimeVersion);
    const archive = await downloadArtifact({ version: runtimeVersion, platform: 'win32', arch: 'x64', artifactName: 'electron' });
    const zip = await JSZip.loadAsync(await fs.readFile(archive));
    for (const [name, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const target = path.resolve(staging, name);
      if (!target.startsWith(staging + path.sep)) throw Error('Unsafe runtime path');
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, await entry.async('nodebuffer'));
    }
  }

  if (await fs.stat(path.join(staging, 'electron.exe')).catch(() => null)) {
    await fs.rename(path.join(staging, 'electron.exe'), path.join(staging, 'CanvasNote.exe'));
  }
  if (!(await fs.stat(path.join(staging, 'ELECTRON-LICENSE.txt')).catch(() => null))) {
    await fs.rename(path.join(staging, 'LICENSE'), path.join(staging, 'ELECTRON-LICENSE.txt'));
  }
  const executable = await fs.open(path.join(staging, 'CanvasNote.exe'), 'r');
  const header = Buffer.alloc(4096);
  try { await executable.read(header, 0, header.length, 0); } finally { await executable.close(); }
  const pe = header.readUInt32LE(0x3c);
  if (header.toString('ascii', 0, 2) !== 'MZ' || pe + 6 > header.length
    || header.toString('ascii', pe, pe + 4) !== 'PE\0\0' || header.readUInt16LE(pe + 4) !== 0x8664) {
    throw Error('Expected Windows AMD64 executable');
  }

  const app = path.join(staging, 'resources', 'app');
  await fs.mkdir(app, { recursive: true });
  for (const name of ['desktop', 'dist', 'examples', 'icon.png', 'third-party-licenses']) {
    await fs.cp(name, path.join(app, name), { recursive: true });
  }
  await fs.writeFile(path.join(app, 'package.json'), JSON.stringify({ name: 'canvasnote', version, main: 'desktop/main.cjs' }, null, 2) + '\n');
  for (const name of ['README.md', 'README.zh-CN.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'docs']) {
    await fs.cp(name, path.join(staging, name), { recursive: true });
  }

  const zip = new JSZip();
  async function walk(directory, prefix = 'CanvasNote-Windows-x64/') {
    const entries = (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(directory, entry.name), name = prefix + entry.name;
      if (entry.isDirectory()) await walk(full, name + '/');
      else if (entry.isFile()) zip.file(name, await fs.readFile(full));
      else throw Error('Unexpected runtime entry');
    }
  }
  await walk(staging);
  await fs.writeFile(temporaryZip, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } }));
  await fs.rename(temporaryZip, output);
  await fs.rm(root, { recursive: true, force: true });
  await fs.rename(staging, root);
  console.log('Packaged', output);
} finally {
  await fs.rm(staging, { recursive: true, force: true });
  await fs.rm(temporaryZip, { force: true });
}
