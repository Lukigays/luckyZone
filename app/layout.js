import './globals.css';
import Shell from '@/components/Shell';
import { SITE_NAME, SITE_TITLE, SITE_DESC, SITE_URL } from '@/lib/site';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: ['nonton film', 'streaming gratis', 'movie sub indo', 'nonton series', 'film terbaru', 'lukyyzone'],
  openGraph: { title: SITE_TITLE, description: SITE_DESC, siteName: SITE_NAME, locale: 'id_ID', type: 'website' },
  icons: { icon: [{ url: '/favicon.ico' }, { url: '/logo.png', type: 'image/png', sizes: '512x512' }], apple: '/apple-touch-icon.png' },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#080A0C',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="bg-ink text-[#E8EDF2] font-body antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
