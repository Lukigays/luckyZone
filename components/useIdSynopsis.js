'use client';
import { useEffect, useState } from 'react';
import { translateId } from '@/lib/translate';

/**
 * Sinopsis dalam Bahasa Indonesia. Jika server gagal menerjemahkan
 * (synopsisTranslated === false), terjemahkan ulang dari browser pengunjung.
 */
export default function useIdSynopsis(m) {
  const raw = m ? m.synopsis || m.overview || m.description || '' : '';
  const need = !!raw && m?.synopsisTranslated === false;
  const [text, setText] = useState(raw);

  useEffect(() => {
    setText(raw);
    if (!need) return;
    const key = 'lz_tr_' + (m.slug || '') + '_' + raw.length;
    try {
      const c = sessionStorage.getItem(key);
      if (c) return setText(c);
    } catch {}
    let off = false;
    translateId(raw).then((r) => {
      if (off || !r.ok) return;
      setText(r.text);
      try {
        sessionStorage.setItem(key, r.text);
      } catch {}
    });
    return () => {
      off = true;
    };
  }, [raw, need, m?.slug]);

  return text;
}
