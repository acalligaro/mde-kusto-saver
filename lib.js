// Pure functions: loaded by the popup, and by Node for test.js.⁣‌‌‌‌‌‌‌​​​‌​​​‌​​‍‌⁣
const HUNTING = 'https://security.microsoft.com/v2/advanced-hunting';

// Defender deep link: ?query= is the KQL as UTF-16LE, gzipped, then Base64-encoded (UTF-8 shows up garbled in the editor).
async function huntingUrl(query, timeRangeId = 'week') {
  const utf16 = new Uint8Array(query.length * 2);
  for (let i = 0; i < query.length; i++) {
    const c = query.charCodeAt(i);
    utf16[2 * i] = c & 255;
    utf16[2 * i + 1] = c >> 8;
  }
  const gz = new Blob([utf16]).stream().pipeThrough(new CompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(gz).arrayBuffer());
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return `${HUNTING}?query=${encodeURIComponent(btoa(bin))}&timeRangeId=${timeRangeId}`;
}

function isHunting(url) {
  try { return new URL(url).origin === 'https://security.microsoft.com'; } catch { return false; }
}

function parseTags(s) {
  return [...new Set(String(s || '').split(',').map(t => t.trim()).filter(Boolean))];
}

// Every word of the search must appear in the name, the tags or the query (case-insensitive).
function matches(item, search) {
  const hay = `${item.name}\n${item.tags.join(' ')}\n${item.query}`.toLowerCase();
  return String(search || '').toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
}

// Insert or replace by id, newest first.
function upsert(list, item) {
  return [item, ...list.filter(x => x.id !== item.id)];
}

// Untrusted import: keep well-formed entries only, imported entries win on id clash.
function mergeImport(list, data) {
  if (!Array.isArray(data)) throw new Error('invalid-format'); // translated by the popup
  let out = list;
  for (const x of data) {
    if (!x || typeof x.name !== 'string' || typeof x.query !== 'string' || !x.name.trim() || !x.query.trim()) continue;
    out = upsert(out, {
      id: typeof x.id === 'string' && x.id ? x.id.slice(0, 64) : crypto.randomUUID(),
      name: x.name.slice(0, 200),
      tags: Array.isArray(x.tags) ? parseTags(x.tags.filter(t => typeof t === 'string').join(',')) : [],
      query: x.query,
      updated: typeof x.updated === 'string' ? x.updated : new Date().toISOString(),
    });
  }
  return out;
}

if (typeof module !== 'undefined') module.exports = { huntingUrl, isHunting, parseTags, matches, upsert, mergeImport };
