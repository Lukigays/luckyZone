'use client';
import { useEffect, useState } from 'react';
import { SITE_NAME } from '@/lib/site';

export default function ShareModal({ title, url, onClose }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  useEffect(() => {
    const fn = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const text = `Nonton "${title}" di ${SITE_NAME}!`;
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);
  const targets = [
    { key: 'whatsapp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: '#25D366', href: `https://wa.me/?text=${t}%20${u}` },
    { key: 'telegram', label: 'Telegram', icon: 'fa-brands fa-telegram', color: '#26A5E4', href: `https://t.me/share/url?url=${u}&text=${t}` },
    { key: 'twitter', label: 'X / Twitter', icon: 'fa-brands fa-x-twitter', color: '#E8EDF2', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { key: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  ];

  const nativeShare = async () => {
    try {
      await navigator.share({ title: text, url });
      onClose();
    } catch {}
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[85vh] bg-inkl border border-line rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-line" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-line flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-base">Bagikan</h2>
            <p className="text-dim text-xs truncate max-w-[240px]">{title}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-ghost flex items-center justify-center text-silver hover:text-gold transition-colors flex-shrink-0"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">
          {canShare && (
            <button
              onClick={nativeShare}
              className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-2xl bg-gold text-ink font-bold text-sm"
            >
              <i className="fa-solid fa-share-nodes text-xs" />
              Bagikan via Aplikasi Lain
            </button>
          )}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {targets.map((s) => (
              <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: s.color + '1A', border: `1px solid ${s.color}40` }}
                >
                  <i className={`${s.icon} text-lg`} style={{ color: s.color }} />
                </div>
                <span className="text-[10px] text-silver text-center leading-tight">{s.label}</span>
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-ghost border border-line">
            <p className="flex-1 text-xs text-dim truncate pl-2">{url.replace(/^https?:\/\//, '')}</p>
            <button
              onClick={copy}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                copied ? 'bg-green-500/20 text-green-400' : 'bg-gold text-ink'
              }`}
            >
              <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'} text-[11px]`} />
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
