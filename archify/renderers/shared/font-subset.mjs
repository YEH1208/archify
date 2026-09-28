// Minimal TrueType (glyf) subsetter for embedding a handful of CJK glyphs.
//
// The embedded font is a Modified Version under the SIL Open Font License, so
// it is renamed to a neutral family name and keeps the original copyright and
// license fields. Layout tables (GSUB/GPOS/...) are dropped: the subset only
// serves short headings that need plain character-to-glyph mapping.
import fs from 'node:fs';

const KEEP_TABLES = new Set(['OS/2', 'cmap', 'cvt ', 'fpgm', 'gasp', 'glyf', 'head', 'hhea', 'hmtx', 'loca', 'maxp', 'name', 'post', 'prep']);

function readTables(buf) {
  if (buf.readUInt32BE(0) !== 0x00010000) throw new Error('font-subset: only TrueType (glyf) fonts are supported');
  const tables = {};
  const count = buf.readUInt16BE(4);
  for (let i = 0; i < count; i += 1) {
    const rec = 12 + i * 16;
    const tag = buf.toString('latin1', rec, rec + 4);
    const offset = buf.readUInt32BE(rec + 8);
    const length = buf.readUInt32BE(rec + 12);
    tables[tag] = buf.subarray(offset, offset + length);
  }
  for (const tag of ['head', 'hhea', 'maxp', 'hmtx', 'cmap', 'loca', 'glyf', 'name', 'post']) {
    if (!tables[tag]) throw new Error(`font-subset: missing ${tag} table`);
  }
  return tables;
}

function cmapLookup(cmap) {
  const count = cmap.readUInt16BE(2);
  let f12 = null;
  let f4 = null;
  for (let i = 0; i < count; i += 1) {
    const platform = cmap.readUInt16BE(4 + i * 8);
    const encoding = cmap.readUInt16BE(6 + i * 8);
    const sub = cmap.subarray(cmap.readUInt32BE(8 + i * 8));
    const format = sub.readUInt16BE(0);
    if (platform === 3 && encoding === 10 && format === 12) f12 = sub;
    if (platform === 3 && encoding === 1 && format === 4) f4 = sub;
  }
  if (f12) {
    const groups = f12.readUInt32BE(12);
    return (cp) => {
      let lo = 0;
      let hi = groups - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const at = 16 + mid * 12;
        const start = f12.readUInt32BE(at);
        const end = f12.readUInt32BE(at + 4);
        if (cp < start) hi = mid - 1;
        else if (cp > end) lo = mid + 1;
        else return f12.readUInt32BE(at + 8) + (cp - start);
      }
      return 0;
    };
  }
  if (f4) {
    const segX2 = f4.readUInt16BE(6);
    const ends = 14;
    const starts = ends + segX2 + 2;
    const deltas = starts + segX2;
    const ranges = deltas + segX2;
    return (cp) => {
      if (cp > 0xffff) return 0;
      for (let s = 0; s < segX2; s += 2) {
        if (cp > f4.readUInt16BE(ends + s)) continue;
        const start = f4.readUInt16BE(starts + s);
        if (cp < start) return 0;
        const delta = f4.readInt16BE(deltas + s);
        const rangeOffset = f4.readUInt16BE(ranges + s);
        if (rangeOffset === 0) return (cp + delta) & 0xffff;
        const gid = f4.readUInt16BE(ranges + s + rangeOffset + (cp - start) * 2);
        return gid === 0 ? 0 : (gid + delta) & 0xffff;
      }
      return 0;
    };
  }
  throw new Error('font-subset: no Windows Unicode cmap');
}

function glyphSlices(tables) {
  const longLoca = tables.head.readInt16BE(50) === 1;
  const numGlyphs = tables.maxp.readUInt16BE(4);
  const at = (i) => (longLoca ? tables.loca.readUInt32BE(i * 4) : tables.loca.readUInt16BE(i * 2) * 2);
  return (gid) => (gid < numGlyphs ? tables.glyf.subarray(at(gid), at(gid + 1)) : Buffer.alloc(0));
}

// Walk composite glyph records; `visit(recordOffset)` receives the offset of each component glyphIndex.
function eachComponent(glyph, visit) {
  if (glyph.length < 10 || glyph.readInt16BE(0) >= 0) return;
  let p = 10;
  for (;;) {
    const flags = glyph.readUInt16BE(p);
    visit(p + 2);
    p += 4 + ((flags & 0x0001) ? 4 : 2);
    if (flags & 0x0008) p += 2;
    else if (flags & 0x0040) p += 4;
    else if (flags & 0x0080) p += 8;
    if (!(flags & 0x0020)) break;
  }
}

function nameRecords(name) {
  const count = name.readUInt16BE(2);
  const strings = name.readUInt16BE(4);
  const out = {};
  for (let i = 0; i < count; i += 1) {
    const r = 6 + i * 12;
    if (name.readUInt16BE(r) !== 3 || name.readUInt16BE(r + 2) !== 1 || name.readUInt16BE(r + 4) !== 0x409) continue;
    const id = name.readUInt16BE(r + 6);
    const len = name.readUInt16BE(r + 8);
    const off = strings + name.readUInt16BE(r + 10);
    out[id] = name.subarray(off, off + len).swap16().toString('utf16le');
    name.subarray(off, off + len).swap16();
  }
  return out;
}

function buildName(original, family, postscript) {
  const src = nameRecords(original);
  const records = [
    [0, src[0] || ''],
    [1, family],
    [2, 'Regular'],
    [3, `${family};subset`],
    [4, family],
    [5, src[5] || 'Version 1.0'],
    [6, postscript],
    [10, 'Glyph subset of an SIL Open Font License 1.1 font; original copyright in the copyright field.'],
    [13, src[13] || 'This Font Software is licensed under the SIL Open Font License, Version 1.1.'],
    [14, src[14] || 'https://openfontlicense.org'],
  ].filter(([, text]) => text);
  const encoded = records.map(([, text]) => Buffer.from(text, 'utf16le').swap16());
  const header = Buffer.alloc(6 + records.length * 12);
  header.writeUInt16BE(0, 0);
  header.writeUInt16BE(records.length, 2);
  header.writeUInt16BE(header.length, 4);
  let offset = 0;
  records.forEach(([id], i) => {
    const r = 6 + i * 12;
    header.writeUInt16BE(3, r);
    header.writeUInt16BE(1, r + 2);
    header.writeUInt16BE(0x409, r + 4);
    header.writeUInt16BE(id, r + 6);
    header.writeUInt16BE(encoded[i].length, r + 8);
    header.writeUInt16BE(offset, r + 10);
    offset += encoded[i].length;
  });
  return Buffer.concat([header, ...encoded]);
}

function buildCmap(pairs) {
  // pairs: [[codepoint, newGid]] sorted by codepoint, BMP only.
  const segs = [...pairs, [0xffff, null]];
  const segX2 = segs.length * 2;
  const log = Math.floor(Math.log2(segs.length));
  const f4 = Buffer.alloc(16 + segs.length * 8);
  f4.writeUInt16BE(4, 0);
  f4.writeUInt16BE(f4.length, 2);
  f4.writeUInt16BE(segX2, 6);
  f4.writeUInt16BE(2 * 2 ** log, 8);
  f4.writeUInt16BE(log, 10);
  f4.writeUInt16BE(segX2 - 2 * 2 ** log, 12);
  segs.forEach(([cp, gid], i) => {
    f4.writeUInt16BE(cp, 14 + i * 2);
    f4.writeUInt16BE(cp, 16 + segX2 + i * 2);
    f4.writeUInt16BE(gid === null ? 1 : (gid - cp) & 0xffff, 16 + segX2 * 2 + i * 2);
  });
  const head = Buffer.alloc(12);
  head.writeUInt16BE(0, 0);
  head.writeUInt16BE(1, 2);
  head.writeUInt16BE(3, 4);
  head.writeUInt16BE(1, 6);
  head.writeUInt32BE(12, 8);
  return Buffer.concat([head, f4]);
}

function checksum(buf) {
  const padded = Buffer.concat([buf, Buffer.alloc((4 - (buf.length % 4)) % 4)]);
  let sum = 0;
  for (let i = 0; i < padded.length; i += 4) sum = (sum + padded.readUInt32BE(i)) >>> 0;
  return sum;
}

function assemble(tables) {
  const tags = Object.keys(tables).sort();
  const n = tags.length;
  const log = Math.floor(Math.log2(n));
  const dir = Buffer.alloc(12 + n * 16);
  dir.writeUInt32BE(0x00010000, 0);
  dir.writeUInt16BE(n, 4);
  dir.writeUInt16BE(16 * 2 ** log, 6);
  dir.writeUInt16BE(log, 8);
  dir.writeUInt16BE(n * 16 - 16 * 2 ** log, 10);
  let offset = dir.length;
  const bodies = [];
  tags.forEach((tag, i) => {
    const data = tables[tag];
    const r = 12 + i * 16;
    dir.write(tag, r, 'latin1');
    dir.writeUInt32BE(checksum(data), r + 4);
    dir.writeUInt32BE(offset, r + 8);
    dir.writeUInt32BE(data.length, r + 12);
    const pad = Buffer.alloc((4 - (data.length % 4)) % 4);
    bodies.push(data, pad);
    offset += data.length + pad.length;
  });
  const font = Buffer.concat([dir, ...bodies]);
  const headAt = dir.readUInt32BE(12 + tags.indexOf('head') * 16 + 8);
  font.writeUInt32BE((0xb1b0afba - checksum(font)) >>> 0, headAt + 8);
  return font;
}

/**
 * Subset a TrueType font to the given characters.
 * @returns {Buffer|null} TTF bytes, or null when none of the characters exist in the font.
 */
export function subsetFont(fontPath, text, { family, postscript }) {
  const tables = readTables(fs.readFileSync(fontPath));
  const lookup = cmapLookup(tables.cmap);
  const glyph = glyphSlices(tables);
  const codepoints = [...new Set([...text].map((c) => c.codePointAt(0)))]
    .filter((cp) => cp > 0x7f && cp <= 0xffff)
    .sort((a, b) => a - b);
  const mapped = codepoints.map((cp) => [cp, lookup(cp)]).filter(([, gid]) => gid > 0);
  if (!mapped.length) return null;

  const order = [0];
  const seen = new Set(order);
  const add = (gid) => {
    if (seen.has(gid)) return;
    seen.add(gid);
    order.push(gid);
    eachComponent(glyph(gid), (p) => add(glyph(gid).readUInt16BE(p)));
  };
  mapped.forEach(([, gid]) => add(gid));
  const newId = new Map(order.map((gid, i) => [gid, i]));

  const numberOfHMetrics = tables.hhea.readUInt16BE(34);
  const metric = (gid) => {
    const i = Math.min(gid, numberOfHMetrics - 1);
    const advance = tables.hmtx.readUInt16BE(i * 4);
    const lsb = gid < numberOfHMetrics
      ? tables.hmtx.readInt16BE(gid * 4 + 2)
      : tables.hmtx.readInt16BE(numberOfHMetrics * 4 + (gid - numberOfHMetrics) * 2);
    return [advance, lsb];
  };

  const glyphs = [];
  const loca = Buffer.alloc((order.length + 1) * 4);
  const hmtx = Buffer.alloc(order.length * 4);
  let offset = 0;
  order.forEach((gid, i) => {
    const data = Buffer.from(glyph(gid));
    eachComponent(data, (p) => data.writeUInt16BE(newId.get(data.readUInt16BE(p)), p));
    const padded = Buffer.concat([data, Buffer.alloc(data.length % 2)]);
    glyphs.push(padded);
    loca.writeUInt32BE(offset, i * 4);
    offset += padded.length;
    const [advance, lsb] = metric(gid);
    hmtx.writeUInt16BE(advance, i * 4);
    hmtx.writeInt16BE(lsb, i * 4 + 2);
  });
  loca.writeUInt32BE(offset, order.length * 4);

  const out = {};
  for (const [tag, data] of Object.entries(tables)) if (KEEP_TABLES.has(tag)) out[tag] = Buffer.from(data);
  out.glyf = Buffer.concat(glyphs);
  out.loca = loca;
  out.hmtx = hmtx;
  out.cmap = buildCmap(mapped.map(([cp, gid]) => [cp, newId.get(gid)]));
  out.name = buildName(tables.name, family, postscript);
  out.head.writeInt16BE(1, 50);
  out.head.writeUInt32BE(0, 8);
  out.hhea.writeUInt16BE(order.length, 34);
  out.maxp.writeUInt16BE(order.length, 4);
  out.post = Buffer.from(tables.post.subarray(0, 32));
  out.post.writeUInt32BE(0x00030000, 0);
  if (out['OS/2'] && out['OS/2'].length >= 68) {
    out['OS/2'].writeUInt16BE(mapped[0][0], 64);
    out['OS/2'].writeUInt16BE(mapped[mapped.length - 1][0], 66);
  }
  return assemble(out);
}
