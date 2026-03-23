'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setText, toggleTag, brewRecipe } from '@/store/slices/cafeAiSlice';
import { getRemainingBrews, getResetDate } from '@/utils/rateLimit';

const MOOD_TAGS = [
  'tired', 'energetic', 'stressed', 'relaxed',
  'happy', 'romantic', 'focused', 'adventurous', 'cozy', 'anxious',
];

const BAR_COLORS: Record<string, string> = {
  bitter: '#8B6F4E',
  sweet:  '#E8A94D',
  acidic: '#C5A35A',
  creamy: '#D4B896',
  bold:   '#3D1F0D',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Space Mono, monospace',
  fontSize: '0.58rem',
  letterSpacing: '0.2em',
  color: 'rgba(255,255,255,0.7)',
  textTransform: 'uppercase',
  marginBottom: 8,
};

const sectionLabel: React.CSSProperties = {
  fontFamily: 'Space Mono, monospace',
  fontSize: '0.58rem',
  letterSpacing: '0.2em',
  color: 'rgba(255,255,255,0.25)',
  textTransform: 'uppercase',
  marginBottom: 12,
};

export default function CafeAI() {
  const dispatch = useAppDispatch();
  const remaining = getRemainingBrews();
  const resetDate = getResetDate().toLocaleDateString();
  const { text, tags, recipe, status, error } = useAppSelector(s => s.cafeai);

  const loading  = status === 'loading';
  const canBrew  = text.trim().length > 0 || tags.length > 0;

  const handleBrew = () => {
    if (!canBrew || loading) return;
    dispatch(brewRecipe({ text, tags }));
  };

  return (
    <div className='cafeai-section' style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 2rem' }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '1.25rem' }}
      >
        <p style={{
          fontFamily: 'Space Mono, monospace', fontSize: '0.6rem',
          letterSpacing: '0.25em', color: 'var(--accent)',
          textTransform: 'uppercase', marginBottom: '0.4rem',
        // eslint-disable-next-line react/jsx-no-comment-textnodes
        }}>
          // AI Project
        </p>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#fff',
          lineHeight: 1, marginBottom: '0.4rem',
        }}>
          CaféAI
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', lineHeight: 1.6 }}>
          Tell me your mood — I&apos;ll craft your perfect cup.{' '}
        </p>
         <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--accent)' }}>HuggingFace</span>{' '} / {' '}
          <span style={{ color: 'var(--accent)' }}>LangChain</span>{' '} / {' '}
          <span style={{ color: 'var(--accent)' }}>OpenAI</span>{' '} 
        </p>
      </motion.div>

      {/* ── Two-column layout ───────────────────────────────────────── */}
      <div
        className="cafeai-cols"
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '18px',
          flex: 1,
          minHeight: 0,
          alignItems: 'start',
        }}
      >

        {/* ══════════════════════════════════════════════════════════
            LEFT — input panel
        ══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'rgba(0,0,0)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '20px 18px',
            display: 'flex', flexDirection: 'column', gap: '14px',
          }}
        >
          {/* Textarea */}
          <div>
            <label style={labelStyle}>Your mood</label>
            <textarea
              value={text}
              onChange={e => dispatch(setText(e.target.value))}
              placeholder="e.g. exhausted after back-to-back meetings..."
              rows={3}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(74,222,128,0.4)',
                borderRadius: 10, color: '#fff',
                fontFamily: 'Syne, sans-serif', fontSize: '0.85rem',
                padding: '11px 13px', resize: 'none', outline: 'none',
                lineHeight: 1.6, transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(74,222,128,0.4)')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Mood tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 10 }}>
              {MOOD_TAGS.map(tag => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => dispatch(toggleTag(tag))}
                    style={{
                      padding: '4px 12px', borderRadius: 999,
                      border: `1px solid ${active ? 'var(--accent)' : 'rgba(255,255,255,0.5)'}`,
                      background: active ? 'rgba(74,222,128,0.1)' : 'transparent',
                      color: active ? 'var(--accent)' : 'rgba(255,255,255,0.38)',
                      fontFamily: 'Syne, sans-serif', fontSize: '0.72rem',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stack pills */}
          {/* <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {['FastAPI', 'LangChain', 'HuggingFace', 'GPT-4o-mini'].map(s => (
              <span key={s} style={{
                padding: '2px 9px', borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.07)',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.55rem', letterSpacing: '0.06em',
                color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
              }}>
                {s}
              </span>
            ))}
          </div> */}

          {/* Brew button */}
          <motion.button
            onClick={handleBrew}
            disabled={loading || !canBrew}
            whileHover={canBrew && !loading ? { scale: 1.02 } : {}}
            whileTap={canBrew && !loading ? { scale: 0.97 } : {}}
            style={{
              width: '100%', padding: '12px',
              borderRadius: 10, border: 'none',
              background: loading || !canBrew
                ? 'rgba(255,255,255,0.05)'
                : 'linear-gradient(135deg, #4ade80, #34d399)',
              color: loading || !canBrew ? 'rgba(255,255,255,0.2)' : '#052e16',
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: '0.88rem', letterSpacing: '0.04em',
              cursor: loading || !canBrew ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '☕ Brewing...' : 'Brew My Coffee'}
          </motion.button>

          <p style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.2)',
            textAlign: 'center',
            marginTop: 8,
          }}>
            {remaining.toLocaleString()} brews remaining · resets {resetDate}
          </p>

          {/* Error */}
          <AnimatePresence>
            {status === 'error' && error && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  color: '#f87171',
                  fontFamily: 'Space Mono, monospace', fontSize: '0.65rem',
                  padding: '9px 12px', borderRadius: 8,
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.2)',
                }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT — result panel
        ══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, minHeight: 420, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Empty state */}
          <AnimatePresence>
            {status === 'idle' && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 10, padding: '2rem',
                }}
              >
                <span style={{ fontSize: 36, opacity: 0.1 }}>☕</span>
                <p style={{
                  fontFamily: 'Space Mono, monospace', fontSize: '0.62rem',
                  letterSpacing: '0.15em', color: 'rgba(255,255,255,0.18)',
                  textTransform: 'uppercase', textAlign: 'center',
                }}>
                  Your recipe will appear here
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 14,
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{
                    width: 30, height: 30,
                    border: '2px solid rgba(74,222,128,0.12)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                  }}
                />
                <p style={{
                  fontFamily: 'Space Mono, monospace', fontSize: '0.62rem',
                  letterSpacing: '0.12em', color: 'rgba(255,255,255,0.22)',
                  textTransform: 'uppercase',
                }}>
                  Analyzing mood → crafting recipe
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recipe */}
          <AnimatePresence>
            {status === 'success' && recipe && (
              <motion.div
                key="recipe"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                style={{ overflowY: 'auto', padding: '22px 22px 26px' }}
              >
                {/* Detected emotions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {Object.entries(recipe.detected_emotions).map(([emotion, score]) => (
                    <span key={emotion} style={{
                      padding: '3px 10px', borderRadius: 999,
                      background: 'rgba(74,222,128,0.07)',
                      border: '1px solid rgba(74,222,128,0.2)',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.57rem', letterSpacing: '0.1em',
                      color: 'var(--accent)', textTransform: 'uppercase',
                    }}>
                      {emotion} {Math.round(score * 100)}%
                    </span>
                  ))}
                </div>

                {/* Name + tagline */}
                <h2 style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 800,
                  fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)',
                  color: '#fff', lineHeight: 1.1, marginBottom: 6,
                }}>
                  {recipe.recipe_name}
                </h2>
                <p style={{
                  fontFamily: 'Syne, sans-serif', fontStyle: 'italic',
                  fontSize: '0.82rem', color: 'rgba(255,255,255,0.32)',
                  marginBottom: 14,
                }}>
                  {recipe.tagline}
                </p>

                {/* Flavor story */}
                <p style={{
                  fontSize: '0.83rem', lineHeight: 1.75,
                  color: 'rgba(255,255,255,0.48)',
                  borderLeft: '2px solid rgba(74,222,128,0.22)',
                  paddingLeft: 13, marginBottom: 20, fontStyle: 'italic',
                }}>
                  {recipe.flavor_story}
                </p>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 20 }}>
                  {[
                    { label: 'Beans',       value: recipe.beans },
                    { label: 'Method',      value: recipe.brew_method },
                    { label: 'Ratio',       value: recipe.ratio },
                    { label: 'Temperature', value: recipe.temperature },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 9, padding: '11px 13px',
                    }}>
                      <p style={{
                        fontFamily: 'Space Mono, monospace', fontSize: '0.52rem',
                        letterSpacing: '0.15em', color: 'rgba(255,255,255,0.22)',
                        textTransform: 'uppercase', marginBottom: 5,
                      }}>
                        {label}
                      </p>
                      <p style={{
                        fontFamily: 'Syne, sans-serif', fontWeight: 600,
                        fontSize: '0.8rem', color: '#fff', lineHeight: 1.4,
                      }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Steps */}
                <div style={{ marginBottom: 20 }}>
                  <p style={sectionLabel}>Brew Steps</p>
                  {recipe.steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      style={{ display: 'flex', gap: 11, marginBottom: 7, alignItems: 'flex-start' }}
                    >
                      <span style={{
                        fontFamily: 'Space Mono, monospace', fontSize: '0.6rem',
                        color: 'var(--accent)', minWidth: 18, paddingTop: 2,
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                        {step}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Flavor profile */}
                <div>
                  <p style={sectionLabel}>Flavor Profile</p>
                  {Object.entries(recipe.flavor_profile).map(([key, val]) => (
                    <div key={key} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{
                          fontFamily: 'Syne, sans-serif', fontSize: '0.72rem',
                          color: 'rgba(255,255,255,0.38)', textTransform: 'capitalize',
                        }}>
                          {key}
                        </span>
                        <span style={{
                          fontFamily: 'Space Mono, monospace', fontSize: '0.58rem',
                          color: 'rgba(255,255,255,0.22)',
                        }}>
                          {val}
                        </span>
                      </div>
                      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
                          style={{
                            height: '100%', borderRadius: 99,
                            background: BAR_COLORS[key] ?? 'var(--accent)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .cafeai-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}