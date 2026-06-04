import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authMe, ApiError } from './api';
import { auth } from '../storage';

type Phase = 'checking' | 'authorized' | 'denied';

export default function DocAuthGate({
  children,
  loginPath = '/admin/v2/login',
}: {
  children: ReactNode;
  loginPath?: string;
}) {
  const location = useLocation();
  const [phase, setPhase] = useState<Phase>('checking');

  useEffect(() => {
    let cancelled = false;

    // Legacy admin localStorage session = allow (preserves existing CMS workflow)
    if (auth.isLoggedIn()) {
      setPhase('authorized');
      return;
    }

    // The session cookie is HttpOnly so JS can't read it. Make the authMe
    // call unconditionally — the browser will attach the cookie if present.
    authMe()
      .then(() => {
        if (!cancelled) setPhase('authorized');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setPhase('denied');
        } else {
          // Network or unexpected — deny to err on the side of security
          setPhase('denied');
        }
      });

    return () => { cancelled = true; };
  }, [location.pathname]);

  if (phase === 'checking') {
    return (
      <main className="doc-auth-gate-loading">
        <p>Checking access…</p>
      </main>
    );
  }

  if (phase === 'denied') {
    const target = `${location.pathname}${location.search}${location.hash}`;
    const sep = loginPath.includes('?') ? '&' : '?';
    return (
      <Navigate
        to={`${loginPath}${sep}returnTo=${encodeURIComponent(target)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
