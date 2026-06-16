'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Sidebar.module.css';

const NAV = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/track', icon: '✏️', label: 'Track Today' },
  { href: '/actions', icon: '⚡', label: 'My Actions' },
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
    <aside className={styles.sidebar}>
      {/* Logo */}
      <Link href="/dashboard" className={styles.logo}>
        <span className={styles.logoIcon}>🌿</span>
        <span className={styles.logoText}>CarbonLife</span>
      </Link>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            {pathname === item.href && <span className={styles.activeIndicator} />}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="avatar" className={styles.avatar} />
          ) : (
            <div className={styles.avatarFallback}>
              {(profile?.displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <div className={styles.userDetails}>
            <span className={styles.userName}>{profile?.displayName || 'User'}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn} title="Sign out">
          🚪
        </button>
      </div>
    </aside>
  );
}
