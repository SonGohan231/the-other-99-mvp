interface Props {
  src: string;
  /** Overall darkness overlay 0–1 (default 0.52). Higher = darker. */
  dim?: number;
}

/**
 * Full-bleed static background image for non-question screens.
 * Sits at z-index 0 inside a `position: relative` parent.
 * No crossfade — these screens have a fixed, single background.
 */
export default function ScreenBackground({ src, dim = 0.52 }: Props) {
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
      <img
        src={src}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
        }}
      />

      {/* Overall dim — ensures legibility regardless of image brightness */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `rgba(10,10,15,${dim})`,
      }} />

      {/* Bottom vignette — anchors floating content visually */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '30%',
        background: 'linear-gradient(to top, rgba(10,10,15,0.60) 0%, transparent 100%)',
      }} />
    </div>
  );
}
