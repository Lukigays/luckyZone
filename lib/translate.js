/**
 * Terjemahan ke Bahasa Indonesia, bisa dipakai di server (Node 18+) maupun browser.
 * Urutan: Google (clients5) → Google (gtx) → MyMemory. Gagal semua → teks asli.
 * Hasil: { text, ok }
 */
const TIMEOUT = 5000;

async function get(url) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = ctl && setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctl?.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    t && clearTimeout(t);
  }
}

function chunks(text, max) {
  const parts = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
  const out = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > max && cur) {
      out.push(cur);
      cur = '';
    }
    cur += p.length > max ? p.slice(0, max) : p;
  }
  if (cur) out.push(cur);
  return out;
}

const engines = [
  async (q) => {
    const d = await get(
      'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=id&q=' + encodeURIComponent(q)
    );
    const first = Array.isArray(d) ? d[0] : null;
    const out = Array.isArray(first) ? first[0] : first;
    if (typeof out !== 'string' || !out) throw new Error('kosong');
    return out;
  },
  async (q) => {
    const d = await get(
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=' + encodeURIComponent(q)
    );
    const out = (d?.[0] || []).map((x) => x[0]).join('');
    if (!out) throw new Error('kosong');
    return out;
  },
  async (q) => {
    const res = [];
    for (const c of chunks(q, 450).slice(0, 4)) {
      const d = await get(
        'https://api.mymemory.translated.net/get?langpair=en%7Cid&q=' + encodeURIComponent(c)
      );
      const out = d?.responseData?.translatedText;
      if (!out || d.responseStatus !== 200 || /MYMEMORY WARNING|QUERY LENGTH/i.test(out)) throw new Error('quota');
      res.push(out);
    }
    return res.join(' ');
  },
];

async function translateId(text) {
  const q = String(text || '').trim().slice(0, 1800);
  if (!q) return { text: text || '', ok: true };
  for (const run of engines) {
    try {
      return { text: await run(q), ok: true };
    } catch {}
  }
  return { text, ok: false };
}

module.exports = { translateId };
