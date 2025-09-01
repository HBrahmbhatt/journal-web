// src/AppGate.tsx
import { useEffect, useState } from 'react';
import { initAuth } from './lib/authManager';

export function AppGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { void initAuth().finally(() => setReady(true)); }, []);
  if (!ready) return <div />;
  return <>{children}</>;
}
