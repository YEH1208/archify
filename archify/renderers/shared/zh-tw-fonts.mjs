// Traditional Chinese (zh-TW) typography for the Editorial ("雜誌") preset.
//
// Windows has no pleasant Traditional Chinese serif, so the Editorial serif
// headings would fall back to PMingLiU. Instead, embed only the glyphs the
// headings actually use from LXGW WenKai TC (SIL OFL 1.1). The subset is a
// Modified Version under the OFL, so it carries a neutral family name, as the
// font author asks, plus the original copyright notice and license text.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { subsetFont } from './font-subset.mjs';

const FONT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/fonts');
const FONT_FILE = path.join(FONT_DIR, 'LXGWWenKaiTC-Medium.ttf');
const LICENSE_FILE = path.join(FONT_DIR, 'LXGWWenKaiTC-OFL.txt');
const FAMILY = 'Archify Kai Subset';

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const decode = (html) => html.replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m]);

const SERIF = `Georgia, 'Times New Roman', '${FAMILY}', 'Microsoft JhengHei', 'PingFang TC', serif`;
const SANS = "Georgia, 'Times New Roman', 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', sans-serif";

/** Build the <style> block for zh-TW pages, or '' for any other locale. */
export function zhTwFontStyle({ locale, title, cards, badge }) {
  if (locale !== 'zh-TW') return '';
  const headings = [...String(cards || '').matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) => decode(m[1]));
  const text = [title, badge, ...headings].join('');
  let fontFace = '';
  if (fs.existsSync(FONT_FILE)) {
    const subset = subsetFont(FONT_FILE, text, { family: FAMILY, postscript: 'ArchifyKaiSubset' });
    if (subset) {
      const license = fs.readFileSync(LICENSE_FILE, 'utf8').replaceAll('*/', '* /');
      fontFace = `/*\n${FAMILY}: glyph subset of LXGW WenKai TC, used as a Modified Version under the\nSIL Open Font License 1.1. Original font: https://github.com/lxgw/LxgwWenkaiTC\n\n${license}\n*/\n`
        + `@font-face { font-family: '${FAMILY}'; font-style: normal; font-weight: 400 800; font-display: block;\n`
        + `  src: url(data:font/ttf;base64,${subset.toString('base64')}) format('truetype'); }\n`;
    }
  }
  return `    <style id="archify-zh-tw-fonts">\n${fontFace}`
    + `html[lang="zh-TW"][data-preset="editorial"] h1,\n`
    + `html[lang="zh-TW"][data-preset="editorial"] .card h3,\n`
    + `html[lang="zh-TW"][data-preset="editorial"] .header-row::after { font-family: ${SERIF}; font-style: normal; }\n`
    + `html[lang="zh-TW"][data-preset="editorial"] .diagram-container::after { font-family: ${SANS}; font-style: normal; font-weight: 700; }\n`
    + '    </style>\n';
}
