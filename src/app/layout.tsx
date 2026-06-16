import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ClientOnly from '@/components/ui/ClientOnly';

export const metadata: Metadata = {
  title: 'CarbonLife — Track & Reduce Your Carbon Footprint',
  description:
    'CarbonLife helps you understand, track, and reduce your carbon footprint with personalized AI-powered insights, visual dashboards, and actionable recommendations.',
  keywords: ['carbon footprint', 'sustainability', 'climate', 'tracker', 'India', 'emissions'],
  openGraph: {
    title: 'CarbonLife',
    description: 'Track and reduce your carbon footprint with AI-powered insights.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#050c14" />
      </head>
      <body>
        <ClientOnly>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#0f1e35',
                  color: '#f1f5f9',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
          </AuthProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
