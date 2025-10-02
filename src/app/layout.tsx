import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ningi | Workflow Builder',
  description: 'Create and manage workflows with stages and tasks',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icondarksquare.png',
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
        <link rel='icon' href='/favicon.ico' sizes='any' />
        <link rel='icon' href='/icondarksquare.png' type='image/png' />
        <link rel='apple-touch-icon' href='/icondarksquare.png' />
      </head>
      <body className='antialiased'>{children}</body>
    </html>
  );
}
