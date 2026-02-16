import type { ReactNode } from 'react';

export interface DocCardProps {
  title: string;
  href: string;
  description: string;
  badge?: string;
}

export interface DocCardGridProps {
  children: ReactNode;
}

export function DocCardGrid({ children }: DocCardGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '0.85rem',
        margin: '1rem 0 1.3rem 0',
      }}
    >
      {children}
    </div>
  );
}

export function DocCard({ title, href, description, badge }: DocCardProps) {
  return (
    <a
      href={href}
      style={{
        border: '1px solid var(--fd-border)',
        borderRadius: 14,
        padding: '0.9rem 1rem',
        textDecoration: 'none',
        color: 'inherit',
        background: 'var(--fd-card)',
        display: 'block',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
        <p style={{ margin: 0, fontWeight: 700 }}>{title}</p>
        {badge ? (
          <span
            style={{
              fontSize: '0.72rem',
              border: '1px solid var(--fd-border)',
              borderRadius: 999,
              padding: '0.2rem 0.55rem',
              opacity: 0.85,
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <p style={{ margin: '0.45rem 0 0 0', opacity: 0.85 }}>{description}</p>
    </a>
  );
}