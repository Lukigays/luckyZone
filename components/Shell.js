'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SITE_NAME, SITE_NAME_A, SITE_NAME_B, WA_CHANNEL, DEV_NAME } from '@/lib/site';

const glass = {
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
};

function Header() {
  const router = useRouter();
  const path = usePathname();
  const isSearch = path.startsWith('/search');
  const isHome = path === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    setScrolled(window.scrollY > 60);
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [isHome]);

  if (path.startsWith('/movie/') || path.startsWith('/watch/')) return null;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-3 transition-all duration-300"
      style={{
        background: scrolled
          ? 'linear-gradient(to bottom, rgba(8,10,12,0.98) 0%, rgba(8,10,12,0.9) 100%)'
          : 'linear-gradient(to bottom, rgba(8,10,12,0.55) 0%, rgba(8,10,12,0) 100%)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 relative bg-inke">
          <img src="/logo.svg" alt={SITE_NAME} className="absolute inset-0 w-full h-full object-contain" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight">
          {SITE_NAME_A}
          <span className="text-gold">{SITE_NAME_B}</span>
        </span>
      </Link>
      <div className="flex-1" />
      {!isSearch && (
        <button
          onClick={() => router.push('/search')}
          aria-label="Cari"
          className="w-10 h-10 rounded-full flex items-center justify-center text-silver hover:text-gold active:scale-90 transition-all duration-200"
          style={{ background: scrolled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)', ...glass }}
        >
          <i className="fa-solid fa-magnifying-glass text-sm" />
        </button>
      )}
    </header>
  );
}

const NAV = [
  { href: '/', icon: 'fa-solid fa-house', label: 'Beranda' },
  { href: '/search', icon: 'fa-solid fa-magnifying-glass', label: 'Cari' },
  { href: '/genre', icon: 'fa-solid fa-layer-group', label: 'Genre' },
  { href: '/popular', icon: 'fa-solid fa-fire', label: 'Populer' },
  { href: '/info', icon: 'fa-solid fa-circle-info', label: 'Info' },
];

function BottomNav() {
  const path = usePathname();
  const active = NAV.findIndex(({ href }) => (href === '/' ? path === '/' : path.startsWith(href)));
  const n = NAV.length;
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}
    >
      <nav
        className="relative flex items-center px-2 py-2 rounded-[28px] w-full max-w-md overflow-visible"
        style={{
          background: 'rgba(15,18,21,0.72)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {active >= 0 && (
          <span
            className="absolute rounded-full pointer-events-none flex flex-col items-center justify-center gap-0.5 transition-transform duration-250 ease-out will-change-transform"
            style={{ left: 0, top: -22, width: `${100 / n}%`, height: 56, transform: `translateX(${100 * active}%)` }}
          >
            <span
              className="flex flex-col items-center justify-center gap-0.5 rounded-full"
              style={{
                width: 56,
                height: 56,
                background: 'linear-gradient(145deg, #FFC15C 0%, #F5A623 55%, #D4891A 100%)',
                boxShadow:
                  '0 8px 20px rgba(245,166,35,0.45), 0 2px 0 rgba(255,255,255,0.25) inset, 0 -6px 10px rgba(0,0,0,0.15) inset',
              }}
            >
              <i className={`${NAV[active].icon} text-[16px] text-ink`} />
              <span className="text-[9px] font-semibold text-ink/80 leading-none">{NAV[active].label}</span>
            </span>
          </span>
        )}
        {NAV.map(({ href, icon, label }, i) => (
          <Link key={href} href={href} className="relative flex-1 flex items-center justify-center py-1.5">
            <span
              className={`flex flex-col items-center justify-center gap-1 transition-opacity duration-200 ${
                i === active ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <i className={`${icon} text-[16px] text-dim`} />
              <span className="text-[9px] font-medium text-dim leading-none">{label}</span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

const JOIN_KEY = 'lz_join_channel_last_shown';
function JoinPopup() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!WA_CHANNEL) return;
    try {
      const last = parseInt(localStorage.getItem(JOIN_KEY) || '0', 10);
      if (Date.now() - last >= 6048e5) {
        const t = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);
  const close = () => {
    try {
      localStorage.setItem(JOIN_KEY, String(Date.now()));
    } catch {}
    setShow(false);
  };
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)' }}
      onClick={close}
    >
      <div className="w-full max-w-sm bg-inke border border-line rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button
            onClick={close}
            aria-label="Tutup"
            className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            <i className="fa-solid fa-xmark text-xs" />
          </button>
          <div className="relative w-full aspect-[16/9] bg-inkb flex items-center justify-center">
            <img src="/logo.svg" alt={SITE_NAME} className="w-20 h-20 rounded-2xl" />
          </div>
        </div>
        <div className="p-4">
          <p className="font-display font-bold text-base mb-1">Jangan Ketinggalan Update!</p>
          <p className="text-dim text-xs leading-relaxed mb-4">
            Join channel WhatsApp {SITE_NAME} untuk dapat info film &amp; series baru, perbaikan server, dan pengumuman
            penting lainnya secara langsung.
          </p>
          <a
            href={WA_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 text-white text-sm font-semibold"
          >
            <i className="fa-brands fa-whatsapp text-base" /> Join Channel
          </a>
          <p className="text-center text-dim text-[10px] mt-3">
            {DEV_NAME} — Developer &amp; maintainer {SITE_NAME}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Shell({ children }) {
  const path = usePathname();
  const noPad = path.startsWith('/movie/') || path.startsWith('/watch/') || path === '/';
  return (
    <>
      <Header />
      <main className={`${noPad ? '' : 'pt-14'} pb-safe min-h-screen`}>{children}</main>
      <BottomNav />
      <JoinPopup />
    </>
  );
}
