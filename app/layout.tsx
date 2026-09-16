import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://walkatlas-italia.elated-ibis-4961.chatgpt.site'),
  title: 'WALKATLAS — Atlante culturale d’Italia',
  description:
    'Esplora siti, musei e luoghi da vivere in Italia. Costruisci il tuo itinerario e portalo con te.',
  openGraph: {
    title: 'WALKATLAS — Atlante culturale d’Italia',
    description:
      'Una mappa culturale interattiva per scoprire luoghi, creare itinerari e iniziare il viaggio.',
    images: ['/walkatlas/walkatlas-v1-foto/esplora-cover-it-v2.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
