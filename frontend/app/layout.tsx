import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo, Tajawal } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import SplashScreen from '@/components/SplashScreen'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  variable: '--font-tajawal',
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'الحسين للاب توب - أفضل لاب توبات مستوردة في مصر',
  description:
    'متجر الحسين للاب توب في شبين القناطر — لابتوبات مستوردة (جديدة ومستعملة ومجددة) بأفضل الأسعار وضمان حقيقي، مع إكسسوارات وتقسيط وشحن لجميع المحافظات.',
  applicationName: 'الحسين للاب توب',
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    siteName: 'الحسين للاب توب',
    title: 'الحسين للاب توب - أفضل لاب توبات مستوردة في مصر',
    description:
      'لابتوبات مستوردة بأفضل الأسعار وضمان حقيقي، مع إكسسوارات وتقسيط وشحن لجميع المحافظات.',
    images: [{ url: '/logo.jpeg', width: 512, height: 512, alt: 'الحسين للاب توب' }],
  },
  twitter: {
    card: 'summary',
    title: 'الحسين للاب توب',
    description: 'لابتوبات مستوردة بأفضل الأسعار وضمان حقيقي في مصر.',
    images: ['/logo.jpeg'],
  },
  // The actual favicon files now live at app/icon.png, app/apple-icon.png,
  // and public/favicon.ico (Next.js's file-based icon convention), which it
  // auto-serves with the right <link> tags and sizes — that's also what
  // Google reads for the little logo shown next to search results. This
  // manual /logo.jpeg reference used to be the only icon Next knew about,
  // and Google/some browsers don't reliably pick up a bare JPEG the same
  // way; the generated PNG/ICO set is what should now show up everywhere,
  // including in search result snippets, once Google recrawls the site.
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Pinch-zoom stays enabled (accessibility); the old maximumScale: 1 blocked it.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0A7F7B' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0F10' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${cairo.variable} ${tajawal.variable} bg-canvas`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var stored=localStorage.getItem('alhussain_theme');var isDark=stored==='dark'||(stored!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(isDark){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased font-body text-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[1000] focus:rounded-lg focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-white"
        >
          تخطي إلى المحتوى
        </a>
        <ThemeProvider>
          <SplashScreen />
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}

