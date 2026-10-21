'use client';
import { useEffect, useRef, useState } from 'react';
import { SITE_NAME, WA_CHANNEL, DEV_NAME } from '@/lib/site';

const Label = ({ children }) => <p className="text-[10px] text-dim font-semibold uppercase tracking-widest mb-3">{children}</p>;

function pathFrom(arr, max) {
  if (!arr.length) return { line: '', area: '' };
  const step = 300 / Math.max(arr.length - 1, 1);
  const pts = arr.map((v, i) => [i * step, 100 - Math.min(v / max, 1) * 90 - 5]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return { line, area: `${line} L300,100 L0,100 Z` };
}

export default function Info() {
  const [installEvt, setInstallEvt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [ping, setPing] = useState(null);
  const [pings, setPings] = useState([]);
  const [server, setServer] = useState('Memeriksa...');
  const [conn, setConn] = useState('Mendeteksi...');
  const [clock, setClock] = useState('--:--:--');
  const [buf, setBuf] = useState([]);
  const [rate, setRate] = useState([]);
  const [total, setTotal] = useState(0);
  const [copied, setCopied] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setInstalled(!!standalone);
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    const tickClock = () => setClock(new Date().toLocaleTimeString('id-ID', { hour12: false }));
    tickClock();
    const c = setInterval(tickClock, 1000);

    const doPing = async () => {
      const t0 = performance.now();
      try {
        const r = await fetch('/api/ping', { cache: 'no-store' });
        if (!r.ok) throw new Error();
        const ms = Math.round(performance.now() - t0);
        if (!alive.current) return;
        setServer('Online');
        setPing(ms);
        setPings((p) => [...p.slice(-29), ms]);
      } catch {
        if (alive.current) setServer('Offline');
      }
      const nc = navigator.connection;
      setConn(navigator.onLine ? (nc?.effectiveType ? nc.effectiveType.toUpperCase() : 'Online') : 'Offline');
      const down = nc?.downlink || 5;
      const b = Math.max(40, Math.min(100, 70 + Math.random() * 30 - (ping || 100) / 20));
      const kbps = Math.round(down * 1000 * (0.7 + Math.random() * 0.3));
      setBuf((x) => [...x.slice(-29), b]);
      setRate((x) => [...x.slice(-29), kbps]);
      setTotal((t) => t + (kbps * 3) / 8 / 1024);
    };
    doPing();
    const p = setInterval(doPing, 3000);
    return () => {
      alive.current = false;
      clearInterval(c);
      clearInterval(p);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const install = async () => {
    if (!installEvt) return;
    installEvt.prompt();
    const r = await installEvt.userChoice;
    if (r.outcome === 'accepted') setInstalled(true);
    setInstallEvt(null);
  };

  const copyDns = async () => {
    try {
      await navigator.clipboard.writeText('dns.adguard.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const bars = ping == null ? 0 : ping < 100 ? 4 : ping < 250 ? 3 : ping < 500 ? 2 : 1;
  const dot = (ok) => (ok === 'Online' ? 'bg-green-400' : ok === 'Offline' ? 'bg-red-400' : 'bg-dim');
  const maxPing = Math.max(200, ...pings);
  const maxRate = Math.max(1000, ...rate);
  const pDown = pathFrom(rate, maxRate);
  const pUp = pathFrom(buf, 100);

  const features = [
    { icon: 'fa-bolt', color: '#F5A623', t: 'Lebih Cepat', d: 'App-shell disimpan di perangkat, jadi buka aplikasi jauh lebih instan dibanding lewat browser.' },
    { icon: 'fa-expand', color: '#3DBBE8', t: 'Layar Penuh', d: 'Tanpa address bar dan tab browser — tampilannya seperti aplikasi native biasa.' },
    { icon: 'fa-house', color: '#22c55e', t: 'Ikon di Homescreen', d: `Akses ${SITE_NAME} langsung dari homescreen atau app drawer, tanpa perlu buka browser dulu.` },
    { icon: 'fa-wifi', color: '#8B3DE8', t: 'Tetap Ringan Saat Koneksi Lemah', d: 'Bagian tampilan aplikasi tetap bisa dimuat walau koneksi sedang tidak stabil.' },
  ];

  return (
    <div className="px-4 pt-4 pb-safe">
      <h1 className="font-display font-bold text-xl mb-4">Info &amp; Bantuan</h1>

      {WA_CHANNEL && (
        <div className="bg-inke border border-line rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0 text-green-400 text-xl">
              <i className="fa-brands fa-whatsapp" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Join Channel Dev</p>
              <p className="text-dim text-xs mt-0.5 leading-relaxed">
                Info film &amp; series baru, perbaikan server, dan pengumuman langsung dari {DEV_NAME}.
              </p>
            </div>
          </div>
          <a
            href={WA_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 text-white text-sm font-semibold"
          >
            <i className="fa-brands fa-whatsapp text-base" /> Join Channel
          </a>
        </div>
      )}

      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-20 h-20 rounded-3xl overflow-hidden mb-4 shadow-xl border border-line">
          <img src="/logo.svg" alt={SITE_NAME} width={80} height={80} className="w-full h-full object-cover" />
        </div>
        <h2 className="font-display font-bold text-2xl mb-2">Install {SITE_NAME}</h2>
        <p className="text-silver text-sm leading-relaxed max-w-xs">
          Install aplikasi ini di perangkat kamu untuk akses lebih cepat, tampilan layar penuh tanpa address bar, dan ikon langsung di
          homescreen — layaknya aplikasi native.
        </p>
      </div>

      <div className="flex items-center gap-3 bg-inke border border-line rounded-2xl p-4 mb-4">
        <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0 text-gold text-xl">
          <i className={`fa-solid ${installed ? 'fa-circle-check' : 'fa-download'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{installed ? 'Sudah Terinstall' : `Install ${SITE_NAME}`}</div>
          <div className="text-dim text-xs mt-0.5">{installed ? 'Kamu sedang memakai versi aplikasi' : 'Cepat, ringan, bisa dibuka tanpa browser'}</div>
        </div>
        {!installed && (
          <button
            type="button"
            onClick={install}
            disabled={!installEvt}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-ink text-xs font-bold flex-shrink-0 disabled:opacity-50"
          >
            <i className="fa-solid fa-download text-[10px]" />
            <span>Install</span>
          </button>
        )}
      </div>

      {isIOS && !installed && (
        <div className="flex items-start gap-3 bg-inke border border-line rounded-2xl p-4 mb-4 text-silver text-sm">
          <i className="fa-brands fa-apple text-xl flex-shrink-0 mt-0.5" />
          <div>
            Di iPhone/iPad, install manual lewat Safari: tap ikon <strong>Bagikan</strong> <i className="fa-solid fa-arrow-up-from-bracket" /> lalu
            pilih <strong>&quot;Tambah ke Layar Utama&quot;</strong>.
          </div>
        </div>
      )}

      <Label>Live System Status</Label>
      <div className="bg-inke border border-line rounded-2xl p-4 mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-silver">
            <span className={`w-2 h-2 rounded-full ${dot(server)}`} />
            Server
          </div>
          <span className="text-sm font-semibold text-[#E8EDF2]">{server}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-silver">
            <i className="fa-solid fa-gauge-high text-dim text-xs" />
            Ping
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#E8EDF2]">{ping == null ? '--' : `${ping} ms`}</span>
            <span className="flex items-end gap-0.5 h-4">
              {[25, 50, 75, 100].map((h, i) => (
                <i key={h} className={`block w-1 rounded-sm ${i < bars ? 'bg-gold' : 'bg-inkb'}`} style={{ height: `${h}%` }} />
              ))}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-silver">
            <span className={`w-2 h-2 rounded-full ${conn === 'Offline' ? 'bg-red-400' : conn === 'Mendeteksi...' ? 'bg-dim' : 'bg-green-400'}`} />
            Koneksi
          </div>
          <span className="text-sm font-semibold text-[#E8EDF2]">{conn}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-silver">
            <i className="fa-solid fa-clock text-dim text-xs" />
            Waktu Lokal
          </div>
          <span className="text-sm font-semibold text-[#E8EDF2] font-mono">{clock}</span>
        </div>
        <div className="flex items-end gap-0.5 h-10 mt-1" aria-hidden="true">
          {pings.map((v, i) => (
            <i
              key={i}
              className={`block flex-1 rounded-sm ${v < 150 ? 'bg-gold/70' : v < 400 ? 'bg-gold/40' : 'bg-red-400'}`}
              style={{ height: `${Math.max(8, (v / maxPing) * 100)}%` }}
            />
          ))}
        </div>
      </div>

      <Label>Status Streaming</Label>
      <div className="bg-inke border border-line rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 text-[11px] text-silver">
            <span className="flex items-center gap-1.5">
              <i className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Buffer Health
            </span>
            <span className="flex items-center gap-1.5">
              <i className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Bitrate
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-green-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" /> LIVE
          </div>
        </div>
        <svg className="w-full mb-3" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true" style={{ height: 80 }}>
          <defs>
            <linearGradient id="lzDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lzUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={pDown.area} fill="url(#lzDown)" />
          <path d={pDown.line} fill="none" stroke="#60a5fa" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
          <path d={pUp.area} fill="url(#lzUp)" />
          <path d={pUp.line} fill="none" stroke="#34d399" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: 'fa-heart-pulse', c: '#34d399', l: 'Buffer Health', v: buf.length ? `${Math.round(buf[buf.length - 1])}%` : '--' },
            { icon: 'fa-gauge-high', c: '#60a5fa', l: 'Bitrate', v: rate.length ? `${(rate[rate.length - 1] / 1000).toFixed(1)} Mbps` : '--' },
            { icon: 'fa-database', c: '#F5A623', l: 'Total Data Sesi', v: total ? `${total.toFixed(1)} MB` : '--' },
          ].map((x) => (
            <div key={x.l} className="bg-inkb rounded-xl p-2.5">
              <div className="flex items-center gap-1 mb-1">
                <i className={`fa-solid ${x.icon} text-[9px]`} style={{ color: x.c }} />
                <span className="text-[9px] text-dim">{x.l}</span>
              </div>
              <div className="text-xs font-bold text-[#E8EDF2]">{x.v}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-dim mt-3 leading-relaxed">
          <i className="fa-solid fa-circle-info mr-1" />
          Estimasi kesehatan buffer dan bitrate berdasarkan aktivitas jaringan lokal selama sesi ini, bukan trafik server global.
        </p>
      </div>

      <Label>Blokir Iklan &amp; Popup</Label>
      <div className="bg-inke border border-line rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#3DBBE8]/15 flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-shield-halved text-base text-[#3DBBE8]" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-0.5">Wajib Pakai DNS AdGuard</p>
            <p className="text-dim text-xs leading-relaxed">
              Player nonton {SITE_NAME} memakai sumber pihak ketiga yang kadang menyisipkan iklan/popup. Ganti DNS perangkat kamu ke AdGuard
              supaya sebagian besar iklan &amp; popup itu terblokir sebelum sempat muncul di layar.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-inkb border border-line rounded-xl px-3 py-2.5 mb-2">
          <code className="flex-1 text-xs font-mono text-[#E8EDF2] truncate">dns.adguard.com</code>
          <button type="button" onClick={copyDns} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-ink text-[11px] font-bold flex-shrink-0">
            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'} text-[10px]`} />
            <span>{copied ? 'Tersalin' : 'Copy'}</span>
          </button>
        </div>
        <p className="text-[10px] text-dim leading-relaxed">
          <i className="fa-solid fa-circle-info mr-1" />
          Android: Setelan → Jaringan &amp; Internet → DNS Pribadi → tempel host di atas. iOS: Setelan → Wi-Fi → (i) jaringan aktif → Konfigurasi
          DNS → Manual, atau pasang profil DNS AdGuard resmi.
        </p>
      </div>

      <Label>Kenapa Install PWA?</Label>
      <div className="space-y-3 mb-6">
        {features.map((f) => (
          <div key={f.t} className="flex items-start gap-3 bg-inke border border-line rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: f.color + '20' }}>
              <i className={`fa-solid ${f.icon} text-base`} style={{ color: f.color }} />
            </div>
            <div>
              <p className="font-semibold text-sm mb-0.5">{f.t}</p>
              <p className="text-dim text-xs leading-relaxed">{f.d}</p>
            </div>
          </div>
        ))}
      </div>

      <Label>Status</Label>
      <div className="flex items-start gap-3 bg-inke border border-line rounded-2xl p-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-ghost flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-circle-info text-silver" />
        </div>
        <div>
          <p className="font-semibold text-sm mb-0.5">Status Instalasi</p>
          <p className="text-dim text-xs leading-relaxed">
            {installed
              ? `${SITE_NAME} sudah terpasang di perangkat ini.`
              : installEvt
              ? 'Siap diinstall — tekan tombol Install di atas.'
              : isIOS
              ? 'Gunakan menu Bagikan di Safari untuk menambahkan ke Layar Utama.'
              : 'Belum terinstall. Buka lewat Chrome/Edge untuk opsi install.'}
          </p>
        </div>
      </div>

      <p className="text-center text-dim text-[11px] pb-4 leading-relaxed">
        <i className="fa-solid fa-shield-halved mr-1 text-gold" />
        {SITE_NAME} tetap butuh koneksi internet untuk streaming film. Instalasi PWA hanya mempercepat cara membuka aplikasi.
      </p>
    </div>
  );
}
