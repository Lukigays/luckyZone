'use client';
import { useEffect, useState } from 'react';

const KEY = 'lz_adtips_open';
const DNS = 'dns.adguard-dns.com';

const TABS = [
  { id: 'android', label: 'Android', icon: 'fa-brands fa-android' },
  { id: 'ios', label: 'iPhone', icon: 'fa-brands fa-apple' },
  { id: 'pc', label: 'PC / Laptop', icon: 'fa-solid fa-desktop' },
];

function Step({ n, children }) {
  return (
    <li className="flex gap-2.5">
      <span
        className="flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold text-gold"
        style={{ width: 18, height: 18, background: 'rgba(232,185,75,0.15)', marginTop: 1 }}
      >
        {n}
      </span>
      <span className="text-[12px] text-silver" style={{ lineHeight: 1.55 }}>
        {children}
      </span>
    </li>
  );
}

const B = ({ children }) => <b className="text-white font-semibold">{children}</b>;

export default function AdTips() {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState('android');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v !== null) setOpen(v === '1');
    } catch {}
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) setTab('ios');
    else if (!/Android/i.test(ua)) setTab('pc');
  }, []);

  const toggle = () => {
    const v = !open;
    setOpen(v);
    try {
      localStorage.setItem(KEY, v ? '1' : '0');
    } catch {}
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(DNS);
    } catch {
      const t = document.createElement('textarea');
      t.value = DNS;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="px-4 py-4 border-b border-line">
      <div className="bg-inke border border-line rounded-2xl overflow-hidden">
        <button onClick={toggle} className="w-full flex items-center gap-3 p-3.5 text-left">
          <span
            className="flex-shrink-0 flex items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#34D399,#059669)' }}
          >
            <i className="fa-solid fa-shield-halved text-sm" style={{ color: '#080A0C' }} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold">Tips Nonton Tanpa Iklan</span>
            <span className="block text-[11px] text-dim">Blokir iklan &amp; popup pemutar dari perangkatmu</span>
          </span>
          <i
            className="fa-solid fa-chevron-down text-xs text-dim"
            style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        {open && (
          <div className="px-3.5 pb-4">
            <div className="flex gap-2 mb-3.5">
              {TABS.map((t) => {
                const on = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      on ? 'bg-gold/20 border-gold/50 text-gold' : 'bg-ghost border-line text-silver'
                    }`}
                  >
                    <i className={`${t.icon} text-[11px]`} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {tab === 'android' && (
              <>
                <p className="text-[10px] text-dim font-semibold uppercase tracking-widest mb-2">
                  Cara termudah · Private DNS
                </p>
                <ol className="space-y-2 mb-3">
                  <Step n={1}>
                    Buka <B>Pengaturan</B> → <B>Koneksi</B> (atau <B>Jaringan &amp; Internet</B>) → <B>Private DNS</B>.
                  </Step>
                  <Step n={2}>
                    Pilih <B>Nama host penyedia Private DNS</B>, lalu tempel alamat ini:
                  </Step>
                </ol>
                <div className="flex items-center gap-2 bg-ink border border-line rounded-xl p-1.5 pl-3 mb-3">
                  <code className="flex-1 text-[12px] text-gold truncate">{DNS}</code>
                  <button
                    onClick={copy}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      copied ? 'bg-gold/20 text-gold' : 'bg-gold text-ink'
                    }`}
                  >
                    <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'} text-[11px]`} />
                    {copied ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
                <ol className="space-y-2" start={3}>
                  <Step n={3}>
                    Tekan <B>Simpan</B>, lalu muat ulang halaman ini. Iklan di semua aplikasi ikut terblokir.
                  </Step>
                  <Step n={4}>
                    Alternatif: pakai browser <B>Brave</B>, atau <B>Firefox</B> + add-on <B>uBlock Origin</B>.
                  </Step>
                </ol>
              </>
            )}

            {tab === 'ios' && (
              <ol className="space-y-2">
                <Step n={1}>
                  Install browser <B>Brave</B> dari App Store. Pemblokir iklannya (<B>Shields</B>) sudah aktif otomatis.
                </Step>
                <Step n={2}>Buka LukyyZone lewat Brave, lalu tonton seperti biasa.</Step>
                <Step n={3}>
                  Mau berlaku di semua aplikasi? Pasang profil DNS gratis dari <B>adguard-dns.io</B> (menu Public DNS →
                  iOS), lalu aktifkan di <B>Pengaturan → Umum → VPN &amp; Manajemen Perangkat</B>.
                </Step>
              </ol>
            )}

            {tab === 'pc' && (
              <ol className="space-y-2">
                <Step n={1}>
                  Pasang ekstensi <B>uBlock Origin</B> di <B>Firefox</B> atau <B>Edge</B> (gratis, dari toko add-on resmi).
                </Step>
                <Step n={2}>
                  Pakai Chrome? Pasang <B>uBlock Origin Lite</B>, atau gunakan browser <B>Brave</B>.
                </Step>
                <Step n={3}>Muat ulang halaman ini setelah ekstensi aktif.</Step>
              </ol>
            )}

            <p className="text-[10px] text-dim mt-3.5" style={{ lineHeight: 1.5 }}>
              <i className="fa-solid fa-circle-info mr-1" />
              Iklan berasal dari penyedia pemutar (bukan dari LukyyZone). LukyyZone sudah menahan popup dari halaman
              ini, tapi iklan di dalam pemutar hanya bisa diblokir dari perangkatmu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
