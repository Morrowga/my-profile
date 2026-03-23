'use client';
import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type FormState = { name: string; email: string; message: string };
type Status = 'idle' | 'sending' | 'sent' | 'error';

const INPUT_STYLE = {
  width: '100%',
  padding: '0.85rem 1rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  color: 'var(--text)',
  fontFamily: 'Syne, sans-serif',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s',
};

export default function Contact() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [focused, setFocused] = useState<string | null>(null);
  const [alreadySent, setAlreadySent] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText('thihaeung@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus('sending');

    try {
      const res = await fetch('https://formspree.io/f/xyknqkqy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    form.name,
          email:   form.email,
          message: form.message,
        }),
      });

      if (res.ok) {
        setStatus('sent');
        setForm({ name: '', email: '', message: '' });
        localStorage.setItem('contact_sent_at', Date.now().toString()); // ← add this
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    const sentAt = localStorage.getItem('contact_sent_at');
    if (sentAt) {
      const hoursPassed = (Date.now() - Number(sentAt)) / (1000 * 60 * 60);
      if (hoursPassed < 24) setAlreadySent(true);  // block for 24 hours
    }
  }, []);

  return (
    <section id="contact" className="contact-section" style={{ padding: '0 2rem' }}>
      <div ref={ref} style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 30 }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: '4rem' }}
        >
          <p className="mono" style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            {'// contact'}
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Let&apos;s build something{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              remarkable
            </span>
          </h2>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '4rem',
          alignItems: 'start',
        }}
        className="contact-grid">
          {/* Left: info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : -30 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: '2.5rem' }}>
              Collaboration on ambitious products, and interesting technical challenges.
              I bring both engineering depth and an eye for craft.
            </p>

            {/* Email copy */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
              padding: '1rem 1.25rem', marginBottom: '2rem',
            }}>
              <span className="mono" style={{ fontSize: '0.85rem', flex: 1 }}>thihaeung@gmail.com</span>
              <button
                onClick={copy}
                style={{
                  padding: '0.35rem 0.9rem',
                  background: copied ? 'var(--accent3)' : 'var(--surface2)',
                  color: copied ? '#050508' : 'var(--text)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4,
                  fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s',
                  letterSpacing: '0.05em',
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            {/* Availability badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.5rem 1rem',
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 4, marginBottom: '2rem',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent3)',
                boxShadow: '0 0 8px var(--accent3)',
                animation: 'pulse-glow 2s ease-in-out infinite',
                display: 'inline-block',
              }} />
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent3)' }}>
                Available for new projects
              </span>
            </div>

            {/* Social links */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'GitHub', href: 'https://github.com/Morrowga' },
                { label: 'LinkedIn', href: 'https://www.linkedin.com/in/thi-ha-eg/' },
                // { label: 'Instagram / X', href: 'https://twitter.com' },
              ].map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                  style={{
                    color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
                    fontWeight: 600, fontSize: '0.9rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          </motion.div>

          {/* Right: form */}
          {alreadySent ? (
          <div style={{
            background: 'rgba(74,222,128,0.06)',
            border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: 12, padding: '2rem',
            textAlign: 'center',
          }}>
            {/* <p style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>✦</p> */}
            <p style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700,
              color: 'var(--accent)', marginBottom: '0.5rem',
            }}>
              Message already sent
            </p>
            <p style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)',
            }}>
              You can send another message after 24 hours.
            </p>
          </div>
        ):(
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : 30 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            {status === 'sent' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: 'rgba(52,211,153,0.08)',
                  border: '1px solid rgba(52,211,153,0.3)',
                  borderRadius: 12, padding: '3rem 2rem', textAlign: 'center',
                }}
              >
                {/* <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✦</div> */}
                <h3 style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent3)' }}>Message sent!</h3>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>I&apos;ll get back to you soon.</p>
                {/* <button
                  onClick={() => setStatus('idle')}
                  style={{
                    marginTop: '1.5rem', padding: '0.5rem 1.5rem',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 4, color: 'var(--text)', cursor: 'pointer',
                    fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.85rem',
                  }}
                >
                  Send another
                </button> */}
              </motion.div>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '2rem',
              }}>
                {(['name', 'email'] as const).map((field) => (
                  <div key={field} style={{ marginBottom: '1.25rem' }}>
                    <label style={{
                      display: 'block', fontSize: '0.75rem', fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.45)', marginBottom: '0.5rem',
                    }}>
                      {field}
                    </label>
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      onFocus={() => setFocused(field)}
                      onBlur={() => setFocused(null)}
                      placeholder={field === 'name' ? 'Your name' : 'your@email.com'}
                      style={{
                        ...INPUT_STYLE,
                        borderColor: focused === field ? 'var(--accent)' : 'var(--border)',
                      }}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block', fontSize: '0.75rem', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.45)', marginBottom: '0.5rem',
                  }}>
                    message
                  </label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    onFocus={() => setFocused('message')}
                    onBlur={() => setFocused(null)}
                    placeholder="What are you building?"
                    style={{
                      ...INPUT_STYLE,
                      resize: 'vertical',
                      borderColor: focused === 'message' ? 'var(--accent)' : 'var(--border)',
                    }}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={status === 'sending'}
                  style={{
                    width: '100%', padding: '0.9rem',
                    background: 'var(--accent)', color: '#050508',
                    border: 'none', borderRadius: 6,
                    fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: '0.9rem', letterSpacing: '0.05em',
                    cursor: status === 'sending' ? 'wait' : 'pointer',
                    opacity: status === 'sending' ? 0.7 : 1,
                    transition: 'opacity 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={(e) => { if (status !== 'sending') e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                >
                  {status === 'sending' ? 'Sending...' : 'Send Message →'}
                </button>
              </div>
            )}
          </motion.div>
        )}
        </div>
      </div>

      {/* Footer */}
      {/* <div style={{ maxWidth: 1100, margin: '5rem auto 0', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <p className="mono" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>
          © {new Date().getFullYear()} Toshiyuki
        </p>
        <p className="mono" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>
          Built with Next.js · Redux · Framer Motion · ☕
        </p>
      </div> */}
    </section>
  );
}