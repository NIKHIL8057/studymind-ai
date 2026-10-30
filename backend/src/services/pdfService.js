import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export const normalize = (t) =>
  t.replace(/\u0000/g, '').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

/** Returns an array of page texts (index 0 = page 1). */
export async function extractPages(buffer) {
  const pages = [];
  await pdfParse(buffer, {
    pagerender: async (pageData) => {
      const tc = await pageData.getTextContent({ normalizeWhitespace: true });
      let out = '';
      let lastY;
      for (const item of tc.items) {
        const y = item.transform[5];
        out += lastY === undefined || lastY === y ? item.str : `\n${item.str}`;
        lastY = y;
      }
      pages.push(out);
      return out;
    },
  });
  return pages.map(normalize);
}

/** Splits page texts into overlapping chunks, keeping the page number of each chunk. */
export function chunkPages(pages, { size = 1000, overlap = 150 } = {}) {
  const chunks = [];
  pages.forEach((text, i) => {
    if (!text) return;
    const page = i + 1;
    if (text.length <= size) return void chunks.push({ page, index: 0, text });
    let start = 0;
    let idx = 0;
    while (start < text.length) {
      let end = Math.min(start + size, text.length);
      if (end < text.length) {
        const br = Math.max(text.lastIndexOf('\n', end), text.lastIndexOf('. ', end));
        if (br > start + size * 0.5) end = br + 1;
      }
      const piece = text.slice(start, end).trim();
      if (piece) chunks.push({ page, index: idx++, text: piece });
      if (end >= text.length) break;
      start = Math.max(end - overlap, start + 1);
    }
  });
  return chunks;
}
