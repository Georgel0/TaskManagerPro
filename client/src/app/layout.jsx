
import '@/styles/global.css';

export const metadata = {
  title: 'Task Manager Pro',
  description: 'Productivity & Team Task Manager',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
        <body>{children}</body>
    </html>
  );
}