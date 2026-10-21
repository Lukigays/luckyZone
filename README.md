# LukyyZone

Clone tampilan moviezone.web.id (Next.js 14 App Router). Data & stream memakai engine `lib/moviezone.js` (Server 7: VidFast).

## Jalankan
```bash
npm install
npm run dev        # http://localhost:3000
# atau produksi
npm run build && npm start
```

## Struktur
- `lib/moviezone.js` — engine scraper kamu (+ tambahan: param `page`, `getHero`, `getUpcoming`, `getGenres`, `discover`)
- `app/api/movies/*` — API routes (path sama dengan aslinya) yang memanggil engine
- `components/*` — UI (Header, Bottom Nav, Hero, Row, Detail, Watch, dll.)
- `lib/site.js` — nama brand, URL, link channel WA
- `app/globals.css` — stylesheet hasil compile Tailwind (tema ink/gold)

## Env (opsional)
- `NEXT_PUBLIC_SITE_URL` — URL domain kamu (untuk link share)
- `NEXT_PUBLIC_WA_CHANNEL` — link channel WhatsApp (mengaktifkan popup & kartu Info)

## Catatan stream
Halaman `/watch/:slug` memakai `stream.url` dari engine (Server 7 VidFast).
Untuk series dipakai `episodes[n].stream.url`. Jika engine tidak mengembalikan stream,
URL VidFast dibuat dari ID TMDB di slug (`movie-123` → `https://vidfast.vc/movie/123`).

CLI engine tetap bisa dipakai: `npm run cli -- trending`
