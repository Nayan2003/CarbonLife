'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Sidebar.module.css';

const NAV = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/track', icon: '✏️', label: 'Track' },
  { href: '/actions', icon: '⚡', label: 'Actions' },
  { href: '/goals', icon: '🎯', label: 'Goals' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className={styles.sidebar} aria-label="Application sidebar">
        {/* Logo */}
        <Link href="/dashboard" className={styles.logo} aria-label="CarbonLife home">
          <span className={styles.logoIcon} role="img" aria-label="leaf">🌿</span>
          <span className={styles.logoText}>CarbonLife</span>
        </Link>

        {/* Nav */}
        <nav className={styles.nav} aria-label="Main navigation">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
              aria-label={item.label}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              <span className={styles.navIcon} role="img" aria-hidden="true">{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {pathname === item.href && <span className={styles.activeIndicator} aria-hidden="true" />}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={`${profile?.displayName || 'User'} avatar`}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarFallback} aria-hidden="true">
                {(profile?.displayName || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className={styles.userDetails}>
              <span className={styles.userName}>{profile?.displayName || 'User'}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            aria-label="Sign out"
            title="Sign out"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation ─────────────────────────────── */}
      <nav className={styles.bottomNav} aria-label="Mobile navigation">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.bottomNavItem} ${pathname === item.href ? styles.bottomNavActive : ''}`}
            aria-label={item.label}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            <span className={styles.bottomNavIcon} role="img" aria-hidden="true">{item.icon}</span>
            <span className={styles.bottomNavLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
