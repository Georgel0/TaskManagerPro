import { MainLayout } from '@/components/layout';
import { AppProvider, ThemeProvider } from '@/context';
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

        <script dangerouslySetInnerHTML={{ __html: themeCheckScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AppProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}