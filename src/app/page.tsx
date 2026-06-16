'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import styles from './page.module.css';

const STATS = [
  { value: '4.7B', label: 'Tonnes CO₂ emitted in India/year' },
  { value: '130kg', label: 'Avg Indian\'s monthly footprint' },
  { value: '40%', label: 'Can be reduced with lifestyle changes' },
];

const FEATURES = [
  { icon: '📊', title: 'Visual Dashboard', desc: 'Charts and KPIs to see your footprint at a glance' },
  { icon: '🤖', title: 'Gemini AI Insights', desc: 'Personalized tips powered by Google\'s Gemini AI' },
  { icon: '🎯', title: 'Goals & Streaks', desc: 'Set targets and build eco-friendly habits' },
  { icon: '🗓️', title: 'Daily Logging', desc: 'Log transport, food, energy in seconds with smart cards' },
  { icon: '🏆', title: 'Achievements', desc: 'Earn badges as you reduce your impact' },
  { icon: '🇮🇳', title: 'India-Specific', desc: 'Factors calibrated for Indian grid, LPG, and commutes' },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      heroRef.current.style.setProperty('--mx', `${x}%`);
      heroRef.current.style.setProperty('--my', `${y}%`);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>🌿 CarbonLife</div>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#how" className={styles.navLink}>How it works</a>
          <Link href="/auth" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.heroBg} />
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span>🌍</span> Built for India · Powered by Gemini AI
          </div>
          <h1 className={styles.heroTitle}>
            Track and reduce your<br />
            <span className="gradient-text">carbon footprint</span>
          </h1>
          <p className={styles.heroSubtitle}>
            CarbonLife gives you a personalized view of your emissions from transport, food, energy, and more — with AI-powered recommendations to make real impact.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/auth" className="btn btn-primary btn-lg">
              Start in 2 minutes →
            </Link>
            <a href="#features" className="btn btn-secondary btn-lg">
              See features
            </a>
          </div>

          {/* Stats */}
          <div className={styles.statsRow}>
            {STATS.map((s, i) => (
              <div key={i} className={styles.statItem}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mock dashboard preview */}
        <div className={styles.heroPreview}>
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <div className={styles.previewDots}>
                <span /><span /><span />
              </div>
              <span className={styles.previewTitle}>Weekly Dashboard</span>
            </div>
            <div className={styles.previewKpis}>
              <div className={styles.previewKpi}>
                <div className={styles.previewKpiValue} style={{ color: '#34d399' }}>42.3 kg</div>
                <div className={styles.previewKpiLabel}>This Week</div>
              </div>
              <div className={styles.previewKpi}>
                <div className={styles.previewKpiValue} style={{ color: '#60a5fa' }}>↓ 12%</div>
                <div className={styles.previewKpiLabel}>vs Last Week</div>
              </div>
              <div className={styles.previewKpi}>
                <div className={styles.previewKpiValue} style={{ color: '#fbbf24' }}>Transport</div>
                <div className={styles.previewKpiLabel}>Top Source</div>
              </div>
            </div>
            <div className={styles.previewBars}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
                <div key={d} className={styles.previewBarWrap}>
                  <div
                    className={styles.previewBar}
                    style={{ height: `${[40,65,30,80,55,45,70][i]}%` }}
                  />
                  <span className={styles.previewBarLabel}>{d}</span>
                </div>
              ))}
            </div>
            <div className={styles.previewAi}>
              <span className={styles.previewAiIcon}>🤖</span>
              <span className={styles.previewAiText}>Your transport emissions dropped 15% this week — great progress!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Everything you need to <span className="gradient-text">go green</span></h2>
          <p className={styles.sectionSubtitle}>A complete toolkit for understanding and reducing your environmental impact</p>
        </div>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className={`${styles.featureCard} glass-card`} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className={styles.howSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Start in <span className="gradient-text">3 simple steps</span></h2>
        </div>
        <div className={styles.stepsRow}>
          {[
            { step: '1', icon: '✍️', title: 'Set up your profile', desc: 'Tell us about your lifestyle — commute, cooking, household size. Takes 2 minutes.' },
            { step: '2', icon: '📱', title: 'Log daily activities', desc: 'Tap a card to log transport, food, or energy use. We calculate CO₂ instantly.' },
            { step: '3', icon: '🚀', title: 'Get AI recommendations', desc: 'Gemini AI analyzes your data and gives you personalized tips to reduce your footprint.' },
          ].map((s, i) => (
            <div key={i} className={styles.stepCard}>
              <div className={styles.stepNumber}>{s.step}</div>
              <div className={styles.stepIcon}>{s.icon}</div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaOrb} />
          <h2 className={styles.ctaTitle}>Ready to make a difference?</h2>
          <p className={styles.ctaSubtitle}>Join thousands of Indians tracking and reducing their carbon footprint</p>
          <Link href="/auth" className="btn btn-primary btn-lg">
            Start tracking for free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>🌿 CarbonLife</div>
          <p className={styles.footerText}>Built with 💚 using Google Firebase &amp; Gemini AI</p>
          <p className={styles.footerText} style={{ marginTop: 4 }}>Emission factors based on Indian Grid &amp; MOEF data</p>
        </div>
      </footer>
    </div>
  );
}
