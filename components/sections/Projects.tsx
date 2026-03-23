'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Images, X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const PROJECTS = [
  {
    id: 1,
    title: 'Intellect',
    subtitle: 'Supply Chain Report Intelligence',
    description: 'External API integrations such as weather forecasts, fuel prices, port status, tariff alerts, disruption alerts, and trade flow data — with weekly corridor reports sent to clients, including AI-generated analysis and recommendations powered by the Claude API based on aggregated statistics.',
    tags: ['Next.js','Redux', 'Claude API', 'PostgreSQL', 'Python', 'FastApi', 'Stripe','Shadcn','API Development', 'API Integrations'],
    accent: 'var(--accent)',
    status: 'Production',
    year: '2026',
    github: { disabled: false, repo: 'Morrowga' },
    website: { show: true, url: 'https://intellect.com', name: 'Intellect' },
    imageCount: 4,
    imageDir: '1',
  },
  {
    id: 2,
    title: 'GlamAI',
    subtitle: 'Beauty Assistant',
    description: "Users can upload a photo to virtually try on cosmetics from any brand worldwide — covering lips, eyes, and cheeks — with support for layering multiple products simultaneously. The app scans skin tone and color season, and can generate complete look recommendations for any occasion based on the user's existing cosmetics. All results are exported as images.",
    tags: ['Next.js','Redux','Shadcn', 'Gemini AI', 'SQLite', 'Stripe','Python','FastApi','API Development'],
    accent: 'var(--accent)',
    status: 'Deployment in Progress',
    year: '2026',
    github: { disabled: false, repo: 'Morrowga' },
    website: null,
    imageCount: 6,
    imageDir: '2',
  },
  {
    id: 3,
    title: 'Bloom',
    subtitle: 'Treatment Reservation System',
    description: "Custom mail system for customer communication, real-time background services for mail, chat, and admin panel data, plus API integrations with the client's core system. Includes mobile application API development enabling users to purchase tickets from the core system and book reservation appointments within the app.",
    tags: ['Laravel 11', 'PHP','MYSQL', 'Docker', 'Vue3','Shadcn','AWS Services - EC2, ALB, Route 53','Systemd', 'Laravel Reverb Server', 'IMAP', 'BeHeDa Core System API Integrations','Firebase'],
    accent: 'var(--accent)',
    status: 'Production',
    year: '2025',
    github: { disabled: false, repo: 'Morrowga' },
    website: { show: true, url: 'https://bloom-app.net', name: 'Bloom' },
    imageCount: 5,
    imageDir: '3',
  },
  {
    id: 4,
    title: 'Nakayama',
    subtitle: 'RealEstate Management System',
    description: "API integration with the client's core system to retrieve owner properties and property statistics, and to create company-owned listings directly. Includes aggregated analytics per property and overall — covering expenses, income, tax returns, vacancy rates, occupancy rates, and monthly unit records — plus real-time chat, OpenAI integration for PDF data extraction, language switching, and auto-fill functionality. Also includes mobile application API development.",
    tags: ['Laravel 12', 'PHP', 'Python','MYSQL','Docker', 'OpenAI', 'Vue3', 'Shadcn', 'IeLove Core System', 'Systemd', 'Firestore', 'Firebase'],
    accent: 'var(--accent)',
    status: 'Deployment in Progress',
    year: '2025',
    github: { disabled: true, repo: 'voyager/nakayama-web' },
    website: { show: true, url: 'https://https://nakayama.vbiz.jp/login', name: 'Nakayama' },
    imageCount: 6,
    imageDir: '4',
  },
  {
    id: 5,
    title: 'Lead Capture Automation',
    subtitle: 'Capturing Lead Data',
    description: "Captures lead data from webhooks with duplicate email detection and automated scoring. Stores results in Google Sheets and sends alerts to Discord or Slack, with error handling via email notifications. Also includes CRM integration with HubSpot.",
    tags: ['N8N', 'Google Sheets', 'Javascript','Json','Discord', 'Slack', 'Hubspot'],
    accent: 'var(--accent)',
    status: 'Deployment in Progress',
    year: '2025',
    github: { disabled: false, repo: 'Morrowga' },
    website: null,
    imageCount: 6,
    imageDir: '5',
  },
  {
    id: 6,
    title: 'Past Experience',
    subtitle: 'Prior Professional Projects',
    description: '',
    tags: ['PHP', 'JavaScript', 'MySQL'],
    accent: 'var(--accent)',
    status: 'Completed',
    year: '2020–2024',
    github: { disabled: true, repo: 'Private' },
    website: null,
    imageCount: 0,
    imageDir: '6',
    pastProjects: [
      'OVUS Polymerase Chain Reaction',
      'WordPress 360 Image Custom Plugin',
      'Custom Flowchart Package on npm',
      'Ento Lemone Job Matching Platform',
      'Myanmar Property Dealer Realestate',
      'MPT Article Scraping System',
      'VVIP9 NFC Card System',
      'TiggieKids Learning Management System',
    ],
  },
];

function buildImages(dir: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `/images/${dir}/${i + 1}.jpg`);
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// ── Gallery Modal ─────────────────────────────────────────────────────────────
function GalleryModal({ images, title, onClose }: { images: string[]; title: string; onClose: () => void }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const go = useCallback((dir: number) => {
    setDirection(dir);
    setCurrent((prev) => (prev + dir + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, go]);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(14,14,18,0.98)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 18,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 880,
          boxShadow: '0 48px 120px rgba(0,0,0,0.75)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.9rem 1.1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Images size={14} style={{ color: 'var(--accent)', opacity: 0.75 }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.03em' }}>
              {title}
            </span>
            <span style={{
              fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)',
              background: 'rgba(255,255,255,0.05)', borderRadius: 4,
              padding: '0.12rem 0.45rem',
            }}>
              {current + 1} / {images.length}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 6,
              color: 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
              padding: '0.28rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.11)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.85)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)';
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Image area with padding so image has breathing room */}
        <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.25)' }}>
          <div style={{
            position: 'relative',
            borderRadius: 10,
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.45)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}>
            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
              <AnimatePresence custom={direction} mode="wait">
                <motion.img
                  key={current}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  src={images[current]}
                  alt={`${title} screenshot ${current + 1}`}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </AnimatePresence>
            </div>

            {images.length > 1 && (
              <>
                <NavBtn direction="left" onClick={() => go(-1)} />
                <NavBtn direction="right" onClick={() => go(1)} />
              </>
            )}
          </div>
        </div>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem 1rem',
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                style={{
                  width: i === current ? 22 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === current ? 'var(--accent)' : 'rgba(255,255,255,0.18)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function NavBtn({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'absolute',
        top: '50%', transform: 'translateY(-50%)',
        [direction]: '0.65rem',
        background: hov ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        color: 'rgba(255,255,255,0.8)',
        cursor: 'pointer',
        width: 34, height: 34,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        backdropFilter: 'blur(4px)',
      }}
    >
      {direction === 'left' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </button>
  );
}

// ── GitHub Button ─────────────────────────────────────────────────────────────
function GitHubButton({ disabled, repo }: { disabled: boolean; repo: string }) {
  const [hov, setHov] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const buttonContent = (
    <>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
      </svg>
      <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', letterSpacing: '0.02em' }}>{repo}</span>
    </>
  );

  const sharedStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    background: disabled ? 'rgba(255,255,255,0.03)' : hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${disabled ? 'rgba(255,255,255,0.06)' : hov ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: 6,
    padding: '0.3rem 0.65rem',
    opacity: disabled ? 0.45 : 1,
    transition: 'all 0.2s',
    color: disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)',
    textDecoration: 'none',
  };

  return (
    <div style={{ position: 'relative' }}>
      {disabled ? (
        <button
          disabled
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{ ...sharedStyle, cursor: 'not-allowed' }}
        >
          {buttonContent}
        </button>
      ) : (
        
        <a  href={`https://github.com/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{ ...sharedStyle, cursor: 'pointer' }}
        >
          {buttonContent}
        </a>
      )}

      <AnimatePresence>
        {showTooltip && disabled && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(20,20,26,0.98)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              padding: '0.4rem 0.75rem',
              whiteSpace: 'nowrap',
              fontSize: '0.68rem',
              color: 'rgba(255,255,255,0.6)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              zIndex: 100,
              pointerEvents: 'none',
            }}
          >
            🔒 Company Private Repository
            <div style={{
              position: 'absolute',
              top: '100%', left: '50%', transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid rgba(255,255,255,0.12)',
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Website Button ────────────────────────────────────────────────────────────
function WebsiteButton({ url, name }: { url: string; name: string }) {
  const [hov, setHov] = useState(false);
  const isMobile = useIsMobile();  // add this
  return (
    
    <a href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        background: hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 6,
        padding: '0.3rem 0.65rem',
        cursor: 'pointer',
        color: hov ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
        transition: 'all 0.2s',
        textDecoration: 'none',
        fontSize: '0.65rem',
      }}
    >
      <ExternalLink size={12} />
      {!isMobile && <span style={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}>{name}</span>}  {/* hide on mobile */}
    </a>
  );
}

// ── Gallery Icon Button ───────────────────────────────────────────────────────
function GalleryIconButton({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const isMobile = useIsMobile();  // add this
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        background: hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 6,
        padding: '0.3rem 0.65rem',
        cursor: 'pointer',
        color: hov ? 'var(--accent)' : 'rgba(255,255,255,0.45)',
        transition: 'all 0.2s',
        fontSize: '0.65rem',
      }}
    >
      <Images size={13} />
      {!isMobile && <span style={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}>Gallery</span>}  {/* hide on mobile */}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Projects() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [hovered, setHovered] = useState<number | null>(null);
  const [gallery, setGallery] = useState<{ images: string[]; title: string } | null>(null);

  return (
    <>
      <section id="projects" className="projects-section" style={{ padding: '2rem 0', background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 30 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: '2rem' }}
          >
            <p className="mono" style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              {'// projects'}
            </p>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Things I&apos;ve built
            </h2>
          </motion.div>

          <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem' }}>
            {PROJECTS.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 40 }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                onMouseEnter={() => setHovered(project.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${hovered === project.id ? project.accent : 'var(--border)'}`,
                  borderRadius: 12,
                  padding: '2rem',
                  cursor: 'default',
                  transition: 'border-color 0.3s, transform 0.3s, box-shadow 0.3s',
                  transform: hovered === project.id ? 'translateY(-4px)' : 'none',
                  boxShadow: hovered === project.id ? `0 16px 40px rgba(0,0,0,0.4)` : 'none',
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <motion.div
                  animate={{ scaleX: hovered === project.id ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: project.accent,
                    transformOrigin: 'left',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{project.title}</h3>
                    <p style={{ color: project.accent, fontSize: '0.8rem', fontWeight: 600 }}>{project.subtitle}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      background: `${project.accent}22`,
                      color: project.accent,
                      borderRadius: 4,
                      fontSize: '0.7rem', fontWeight: 700,
                      letterSpacing: '0.05em',
                      marginBottom: '0.25rem',
                    }}>
                      {project.status}
                    </span>
                    <p className="mono" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>{project.year}</p>
                  </div>
                </div>

                {/* <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                  {project.description}
                </p> */}
                {project.pastProjects ? (
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 1.5rem 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    flex: 1,
                  }}>
                    {project.pastProjects.map((name) => (
                      <li key={name} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontSize: '0.88rem',
                        color: 'rgba(255,255,255,0.6)',
                      }}>
                        <span style={{
                          width: 5, height: 5,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          flexShrink: 0,
                          opacity: 0.7,
                        }} />
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                    {project.description}
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {project.tags.map((tag) => (
                    <span key={tag} className="mono" style={{
                      padding: '0.25rem 0.6rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      fontSize: '0.65rem',
                      color: 'rgba(255,255,255,0.45)',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* ── Action row ── */}
                {!project.pastProjects && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <GitHubButton disabled={project.github.disabled} repo={project.github.repo} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {project.website?.show && (
                        <WebsiteButton url={project.website.url} name={project.website.name} />
                      )}
                      <GalleryIconButton
                        onClick={() => setGallery({
                          images: buildImages(project.imageDir, project.imageCount),
                          title: project.title,
                        })}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {gallery && (
          <GalleryModal
            images={gallery.images}
            title={gallery.title}
            onClose={() => setGallery(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}