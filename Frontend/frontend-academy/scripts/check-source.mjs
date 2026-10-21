import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(project, '../Frontend');
const baseline = JSON.parse((await readFile(resolve(project, 'docs/original-files-before.json'), 'utf8')).replace(/^\uFEFF/, ''));
async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(path));
    else if (entry.isFile()) files.push({
      path: relative(source, path).split(sep).join('/'),
      sha256: createHash('sha256').update(await readFile(path)).digest('hex').toUpperCase(),
      bytes: (await stat(path)).size,
    });
    else throw new Error(`Unsupported source entry: ${path}`);
  }
  return files;
}
const current = await collect(source);
const expected = new Map(baseline.map(file => [file.path.replaceAll('\\', '/'), file]));
const problems = [];
for (const file of current) {
  const before = expected.get(file.path);
  if (!before) problems.push(`Added: ${file.path}`);
  else if (before.sha256 !== file.sha256 || before.bytes !== file.bytes) problems.push(`Changed: ${file.path}`);
  expected.delete(file.path);
}
for (const path of expected.keys()) problems.push(`Missing: ${path}`);
const report = { checkedAt: new Date().toISOString(), source, files: current.length, unchanged: problems.length === 0, problems };
await writeFile(resolve(project, 'docs/original-files-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (problems.length) process.exitCode = 1;
