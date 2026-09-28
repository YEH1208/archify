import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { subsetFont } from '../renderers/shared/font-subset.mjs';
import { zhTwFontStyle } from '../renderers/shared/zh-tw-fonts.mjs';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontFile = path.join(skillRoot, 'assets/fonts/LXGWWenKaiTC-Medium.ttf');

function nameStrings(ttf) {
  const count = ttf.readUInt16BE(4);
  for (let i = 0; i < count; i += 1) {
    const rec = 12 + i * 16;
    if (ttf.toString('latin1', rec, rec + 4) !== 'name') continue;
    const table = ttf.subarray(ttf.readUInt32BE(rec + 8));
    const strings = table.readUInt16BE(4);
    const out = {};
    for (let r = 0; r < table.readUInt16BE(2); r += 1) {
      const at = 6 + r * 12;
      const id = table.readUInt16BE(at + 6);
      const off = strings + table.readUInt16BE(at + 10);
      out[id] = Buffer.from(table.subarray(off, off + table.readUInt16BE(at + 8))).swap16().toString('utf16le');
    }
    return out;
  }
  return {};
}

test('the subset keeps only requested glyphs under a neutral family name and the original copyright', () => {
  const ttf = subsetFont(fontFile, '整體架構', { family: 'Archify Kai Subset', postscript: 'ArchifyKaiSubset' });
  assert.ok(ttf.length < 20000, `subset unexpectedly large: ${ttf.length}`);
  const names = nameStrings(ttf);
  assert.equal(names[1], 'Archify Kai Subset');
  assert.equal(names[6], 'ArchifyKaiSubset');
  assert.match(names[0], /Copyright 2022-2026 LXGW/);
  assert.match(names[0], /Klee Project Authors/);
  for (const id of [1, 3, 4, 6]) assert.doesNotMatch(names[id], /LXGW|霞鶩/);
});

test('zh-TW pages embed the Editorial heading subset with the OFL text; other locales embed nothing', () => {
  const style = zhTwFontStyle({
    locale: 'zh-TW',
    title: '系統架構',
    cards: '<div class="card"><h3>資料 &amp; 流程</h3></div>',
    badge: '筆記 / 現場紀錄',
  });
  assert.match(style, /@font-face \{ font-family: 'Archify Kai Subset'/);
  assert.match(style, /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.match(style, /html\[lang="zh-TW"\]\[data-preset="editorial"\] h1/);
  assert.doesNotMatch(style, /PMingLiU/);
  assert.equal(zhTwFontStyle({ locale: 'en', title: 'x', cards: '', badge: '' }), '');
  assert.equal(zhTwFontStyle({ locale: 'zh-CN', title: '系统', cards: '', badge: '' }), '');
});

test('the bundled font and its license are present', () => {
  assert.ok(fs.statSync(fontFile).size > 1_000_000);
  assert.match(fs.readFileSync(path.join(skillRoot, 'assets/fonts/LXGWWenKaiTC-OFL.txt'), 'utf8'), /SIL OPEN FONT LICENSE Version 1\.1/);
});
