'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '@/store/hooks';

export default function ZoomTransition() {
  const { isTransitioning } = useAppSelector(s => s.navigation);

  return (
    <AnimatePresence>
      {isTransitioning && (
        <>
          {/* Planet — pure black, grows slowly and smoothly */}
          <motion.div
            key="planet-zoom"
            initial={{ scale: 0 }}
            animate={{ scale: 45 }}
            transition={{ duration: 1.6, ease: [0.08, 0, 0.25, 1] }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              width: 70, height: 70,
              marginTop: -35, marginLeft: -35,
              borderRadius: '50%',
              zIndex: 998,
              pointerEvents: 'none',
              background: 'radial-gradient(circle at 38% 32%, #2a2a2a 0%, #111 40%, #000 100%)',
              boxShadow: '0 0 80px 30px rgba(255,255,255,0.04)',
            }}
          >
            {/* Atmosphere darkening — fades in after planet is large enough */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.4, 0.75, 1] }}
              transition={{ duration: 1.6, times: [0, 0.45, 0.65, 0.82, 1], ease: 'easeIn' }}
              style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.5) 50%, #000 100%)',
              }}
            />
          </motion.div>

          {/* Soft glow ring that fades out as planet arrives */}
          <motion.div
            key="planet-ring"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 44, opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.08, 0, 0.25, 1] }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              width: 70, height: 70,
              marginTop: -35, marginLeft: -35,
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.15)',
              zIndex: 997,
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}