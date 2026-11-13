// Hand-written copies of the tool list in this package must match TOOLS. When a tool is added,
// removed, or renamed, these fail until manifest.json and the README are updated.
// vybitapp has its own copies (llms.txt, the ChatGPT submission) guarded by its own test.

process.env.VYBIT_MCP_NO_STDIO = 'true';

import * as fs from 'fs';
import * as path from 'path';
import { TOOLS } from '../index';

const PKG = path.join(__dirname, '../..');
const names = TOOLS.map((t) => t.name).sort();

describe('manifest.json', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(PKG, 'manifest.json'), 'utf8'));

  it('lists every tool, and nothing else', () => {
    expect(manifest.tools.map((t: { name: string }) => t.name).sort()).toEqual(names);
  });
});

describe('README.md', () => {
  const readme = fs.readFileSync(path.join(PKG, 'README.md'), 'utf8');
  const section = readme.split('\n## Available Tools\n')[1].split('\n### Structured Output')[0];
  const bullet = /^- `([a-z_]+)` - /;

  it('lists every tool under Available Tools, and nothing else', () => {
    const listed = section.split('\n').map((line) => (line.match(bullet) || [])[1]).filter(Boolean);
    expect(listed.sort()).toEqual(names);
  });

  it('states the right tool counts', () => {
    expect(section).toContain(`**${TOOLS.length} tools**`);
    const total = readme.match(/all (\d+) MCP tools/);
    if (total) expect(Number(total[1])).toBe(TOOLS.length);
    // each "### Group (N tools)" heading matches the bullets under it
    for (const group of section.split('\n### ').slice(1)) {
      const heading = group.split('\n')[0];
      const count = heading.match(/\((\d+) tools?\)/);
      if (!count) continue;
      const bullets = group.split('\n').filter((line) => bullet.test(line)).length;
      expect(`${heading}: ${bullets}`).toBe(`${heading}: ${count[1]}`);
    }
  });
});
