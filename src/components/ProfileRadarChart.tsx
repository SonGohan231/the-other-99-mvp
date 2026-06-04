import React from 'react';
import { ProfileVector, DIMENSIONS } from '../utils/profileVector';

interface Props {
  vector: ProfileVector;
  size?: number;
  variant?: 'mini' | 'full';
  highlightedAxes?: string[];
  className?: string;
  style?: React.CSSProperties;
}

const AXIS_LABELS: Record<string, { mini: string; full: string }> = {
  control:      { mini: 'CTL',  full: 'Control'   },
  security:     { mini: 'SEC',  full: 'Security'  },
  risk:         { mini: 'RSK',  full: 'Risk'       },
  emotion:      { mini: 'EMO',  full: 'Emotion'   },
  change:       { mini: 'CHG',  full: 'Change'    },
  independence: { mini: 'IND',  full: 'Independ.' },
  connection:   { mini: 'CON',  full: 'Connect.'  },
  curiosity:    { mini: 'CUR',  full: 'Curiosity' },
};

const MAX_VALUE = 20;

export default function ProfileRadarChart({
  vector,
  size = 200,
  variant = 'full',
  highlightedAxes = [],
  className,
  style,
}: Props) {
  const dims = DIMENSIONS as unknown as string[];
  const n = dims.length;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.38;
  const labelR = size * 0.47;
  const fontSize = variant === 'mini' ? size * 0.07 : size * 0.065;

  const hasData = dims.some((d) => vector[d as keyof ProfileVector] > 0);

  function getPoint(index: number, value: number, r = outerR): { x: number; y: number } {
    const angle = (2 * Math.PI * index) / n - Math.PI / 2;
    const clampedVal = Math.min(value, MAX_VALUE);
    const fraction = r * (clampedVal / MAX_VALUE);
    return {
      x: cx + fraction * Math.cos(angle),
      y: cy + fraction * Math.sin(angle),
    };
  }

  function getLabelPoint(index: number): { x: number; y: number } {
    const angle = (2 * Math.PI * index) / n - Math.PI / 2;
    return {
      x: cx + labelR * Math.cos(angle),
      y: cy + labelR * Math.sin(angle),
    };
  }

  // Build polygon points
  const polygonPoints = dims
    .map((dim, i) => {
      const val = vector[dim as keyof ProfileVector] ?? 0;
      const pt = getPoint(i, val);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  // Concentric rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1.0].map((pct) => {
    return dims
      .map((_, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const r = outerR * pct;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      })
      .join(' ');
  });

  const labelKey = variant === 'mini' ? 'mini' : 'full';

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      style={style}
      aria-label="Profile radar chart"
    >
      {/* Background rings */}
      {rings.map((pts, ri) => (
        <polygon
          key={ri}
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.8"
        />
      ))}

      {/* Axis lines */}
      {dims.map((dim, i) => {
        const outer = getPoint(i, MAX_VALUE);
        const isHighlighted = highlightedAxes.includes(dim);
        return (
          <line
            key={dim}
            x1={cx}
            y1={cy}
            x2={outer.x}
            y2={outer.y}
            stroke={isHighlighted ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={isHighlighted ? 1.5 : 0.8}
          />
        );
      })}

      {/* Profile polygon */}
      {hasData && (
        <>
          <polygon
            points={polygonPoints}
            fill="rgba(124,58,237,0.15)"
            stroke="rgba(124,58,237,0.6)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Data points */}
          {dims.map((dim, i) => {
            const val = vector[dim as keyof ProfileVector] ?? 0;
            if (val <= 0) return null;
            const pt = getPoint(i, val);
            return (
              <circle
                key={dim}
                cx={pt.x}
                cy={pt.y}
                r={2}
                fill="rgba(167,139,250,0.8)"
              />
            );
          })}
        </>
      )}

      {/* Axis labels */}
      {dims.map((dim, i) => {
        const lp = getLabelPoint(i);
        const label = AXIS_LABELS[dim]?.[labelKey] ?? dim;
        const val = vector[dim as keyof ProfileVector] ?? 0;
        return (
          <text
            key={dim}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fontSize}
            fill={val > 0 ? 'rgba(209,213,219,0.8)' : 'rgba(107,114,128,0.6)'}
            fontFamily="inherit"
          >
            {label}
          </text>
        );
      })}

      {/* Empty state hint */}
      {!hasData && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize * 0.9}
          fill="rgba(107,114,128,0.5)"
          fontFamily="inherit"
        >
          {variant === 'mini' ? '' : 'No data yet'}
        </text>
      )}
    </svg>
  );
}
