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

## Sumber data (otomatis)

`lib/source.js` mengatur sumber data:

1. **moviezone.js** dicoba duluan (engine utama).
2. Kalau gagal / 403 / timeout 8 detik, otomatis pindah ke **Cinemeta** (`lib/cinemeta.js`, publik, tanpa API key) dan moviezone dilewati selama 10 menit.
3. Slug `movie-tt…` / `tv-tt…` (IMDb ID) selalu dari Cinemeta; slug angka (TMDB) dari moviezone.

Streaming tetap **Server 7 VidFast** (`vidfast.vc/movie/{tmdb|imdb}`, `vidfast.vc/tv/{id}/{s}/{e}`).
Sinopsis dari Cinemeta otomatis diterjemahkan ke Bahasa Indonesia.

Paksa sumber tertentu lewat env: `LZ_SOURCE=auto | moviezone | cinemeta` (default `auto`).

## Server streaming

`lib/servers.js` berisi 7 server (sama seperti situs asli):
1 VidSrcWiki · 2 SuperEmbed · 3 VidSrc · 4 VidLink ★ · 5 2Embed · 6 VSEmbed · 7 VidFast (BETA, URL dari moviezone.js).

- Default: server terakhir yang dipilih pengunjung (disimpan di browser), kalau belum ada → VidLink.
- Tombol **Server Lain** di bawah pemutar langsung pindah ke server berikutnya.
- Kalau pemutar belum termuat setelah 12 detik muncul tombol "Terlalu lama? Coba server lain".
- Item yang hanya punya ID IMDb (tt…) tetap bisa diputar; VidLink-series dilewati karena butuh ID TMDB.

## Terjemahan sinopsis

`lib/translate.js`: Google (clients5) → Google (gtx) → MyMemory. Kalau server Vercel kena limit,
browser pengunjung yang menerjemahkan (`components/useIdSynopsis.js`).
