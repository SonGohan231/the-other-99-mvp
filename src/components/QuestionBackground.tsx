import { useEffect, useState, useRef } from 'react';

interface Props {
  src: string;
}

/**
 * Full-bleed background image for the question screen.
 * Cross-fades between images when src changes.
 * Readability overlays ensure all UI elements remain legible.
 */
export default function QuestionBackground({ src }: Props) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [nextSrc, setNextSrc] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (src === currentSrc) return;

    // Start crossfade: bring in new src on top, then swap
    setNextSrc(src);
    setTransitioning(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrentSrc(src);
      setNextSrc(null);
      setTransitioning(false);
    }, 500);
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Persistent current image */}
      <img
        src={currentSrc}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
        }}
      />

      {/* Incoming image — fades in on top, then becomes current */}
      {nextSrc && (
        <img
          key={nextSrc}
          src={nextSrc}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            opacity: transitioning ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        />
      )}

      {/* ── Readability overlays ─────────────────────────────────────── */}

      {/* Overall base dim — lifts baseline contrast */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(10,10,15,0.30)',
      }} />

      {/* Top gradient — protects nav buttons, status bar, question number */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '220px',
        background: 'linear-gradient(to bottom, rgba(10,10,15,0.90) 0%, rgba(10,10,15,0.55) 55%, transparent 100%)',
      }} />

      {/* Bottom gradient — protects answer buttons and CTA */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '65%',
        background: 'linear-gradient(to top, rgba(10,10,15,0.97) 0%, rgba(10,10,15,0.85) 30%, rgba(10,10,15,0.50) 60%, transparent 100%)',
      }} />
    </div>
  );
}
