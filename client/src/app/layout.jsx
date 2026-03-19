import { MainLayout } from '@/components/layout';
import { AppProvider } from '@/context';
import '@/styles/global.css';
import '@/styles/components.css';

export const metadata = {
  title: 'Task Manager Pro',
  description: 'Productivity & Team Task Manager',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>
        <AppProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </AppProvider>
      </body>
    </html>
  );
}