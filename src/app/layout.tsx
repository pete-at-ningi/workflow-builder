import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ningi | Workflow Template Builder',
  description: 'Create and manage workflow templates with stages and tasks',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <link rel='icon' href='/favicon.ico' />
      </head>
      <body className='antialiased'>{children}</body>
    </html>
  );
}
