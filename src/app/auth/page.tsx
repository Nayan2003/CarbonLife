'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import styles from './page.module.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, profile } = useAuth();
  const router = useRouter();

  const redirect = (p: { onboardingComplete?: boolean } | null) => {
    router.push(p?.onboardingComplete ? '/dashboard' : '/onboarding');
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome!');
      redirect(profile);
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      redirect(profile);
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg} />
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <Link href="/" className={styles.backLink}>← Back to home</Link>

      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>🌿 CarbonLife</div>
          <h1 className={styles.title}>{isLogin ? 'Welcome back' : 'Create account'}</h1>
          <p className={styles.subtitle}>
            {isLogin ? 'Sign in to continue tracking your footprint' : 'Start your sustainability journey today'}
          </p>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className={styles.googleBtn}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2a10 10 0 0 0-.16-1.7H9v3.22h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.5z"/>
            <path fill="#34A853" d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.92-2.26a5.43 5.43 0 0 1-8.07-2.85H.96v2.34A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.97 7.3V4.96H.96A9 9 0 0 0 .96 13.05z"/>
            <path fill="#EA4335" d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .96 4.96L3.97 7.3A5.4 5.4 0 0 1 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <div className={styles.divider}><span>or</span></div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="form-input" placeholder="Your name" required
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="form-input" placeholder="you@example.com" required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="form-input" placeholder="••••••••" required minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Toggle */}
        <p className={styles.toggleText}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setIsLogin(!isLogin)} className={styles.toggleBtn}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
