'use client';

// This component ensures no Firebase-dependent page renders on the server
// during static export (next export). All child pages are client-only.
import { useEffect, useState, ReactNode } from 'react';

export default function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#050c14', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, border: '2px solid rgba(255,255,255,0.1)',
        borderTopColor: '#10b981', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  return <>{children}</>;
}
