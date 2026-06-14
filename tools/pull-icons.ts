import fs from 'fs-extra';
import Path from 'path';
import { pipeline } from 'stream';
import fetch from 'node-fetch';
import { promisify } from 'util';
import extract from 'extract-zip';

const streamPipeline = promisify(pipeline);

const downloadUrl =
  'https://game-icons.net/archives/svg/zip/ffffff/transparent/game-icons.net.svg.zip';
const tempDir = './temp';
const outputDir = './static/icons';

async function walk(directory: string) {
  let fileList: string[] = [];

  const files = await fs.readdir(directory);
  for (const file of files) {
    const p = Path.join(directory, file);
    if ((await fs.stat(p)).isDirectory()) {
      fileList = [...fileList, ...(await walk(p))];
    } else {
      fileList.push(p);
    }
  }

  return fileList;
}

async function downloadFile(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Unexpected response: ${res.statusText}`);
  }

  await streamPipeline(res.body, fs.createWriteStream(dest));
}

async function unzipIconFiles(path: string, output: string) {
  const temp_folder = output + '_temp';
  const extractedIconsDir = Path.join(temp_folder, 'icons', 'ffffff', 'transparent', '1x1');

  await extract(path, { dir: Path.resolve(temp_folder) });
  await fs.emptyDir(output);
  await fs.copy(extractedIconsDir, output, { overwrite: true });
  await fs.rm(temp_folder, { recursive: true, force: true });
}

async function indexFiles(path: string, outputJson: string) {
  const files = await walk(path);
  const iconNames = new Set<string>();
  const map = files
    .filter((file) => Path.extname(file) === '.svg')
    .map((file) => {
      const baseName = Path.basename(file, '.svg');
      let name = baseName;
      let count = 2;

      while (iconNames.has(name)) {
        name = `${name}${count}`;
        count++;
      }

      iconNames.add(name);

      return {
        path: Path.relative(path, file).split(Path.sep).join('/'),
        name
      };
    });

  await fs.writeJson(outputJson, map, { spaces: 2 });
}

export async function pullIcons(): Promise<void> {
  const zipFile = Path.join(tempDir, 'icons.zip');
  const tempIconsPath = Path.join(tempDir, 'icons');
  const tempJsonPath = Path.join(tempIconsPath, 'icons.json');

  await fs.emptyDir(tempDir);
  console.log('Downloading...');
  try {
    await downloadFile(downloadUrl, zipFile);
    console.log('Unzipping...');
    await unzipIconFiles(zipFile, tempIconsPath);
    console.log('Indexing...');
    await indexFiles(tempIconsPath, tempJsonPath);
    console.log('Removing old icons...');
    await fs.emptyDir(outputDir);
    console.log('Moving...');
    await fs.copy(tempIconsPath, outputDir, { overwrite: true });
  } catch (error) {
    console.warn(
      'There was a problem downloading icons - falling back to currently downloaded icons'
    );
    console.warn(error);
  } finally {
    console.log('Removing temp...');
    await fs.remove(tempDir);
  }
}

pullIcons();
