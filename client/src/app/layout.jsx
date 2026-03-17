import { MainLayout } from '@/components/layout';
import '@/styles/global.css';

export const metadata = {
  title: 'Task Manager Pro',
  description: 'Productivity & Team Task Manager',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>
      </head>
      <body>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}