import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Providers } from './providers';
import '@/styles/global.css';
import '@/styles/components.css';

export const metadata = {
  title: 'Task Manager Pro',
  description: 'Productivity & Team Task Manager',
};

const themeCheckScript = `
  (function() {
    try {
      var theme = localStorage.getItem('task_manager_theme') || 'light-default';
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {};
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <meta name="google-site-verification" content="v8A1l6prTZI0zVX7BNG8ED3bOFFoboonvYTOweM6P5s" />
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="TMP" />
        <link rel="manifest" href="/site.webmanifest" />
        <script dangerouslySetInnerHTML={{ __html: themeCheckScript }} />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}