interface DocCalloutProps {
  tone?: 'info' | 'warning' | 'success' | 'danger';
  title?: string;
  children: React.ReactNode;
}

const styles = {
  info: {
    border: '1px solid #3b82f6',
    background: 'rgba(59, 130, 246, 0.08)',
  },
  warning: {
    border: '1px solid #f59e0b',
    background: 'rgba(245, 158, 11, 0.1)',
  },
  success: {
    border: '1px solid #10b981',
    background: 'rgba(16, 185, 129, 0.1)',
  },
  danger: {
    border: '1px solid #ef4444',
    background: 'rgba(239, 68, 68, 0.1)',
  },
} as const;

export function DocCallout({ tone = 'info', title, children }: DocCalloutProps) {
  return (
    <div
      style={{
        ...styles[tone],
        borderRadius: 12,
        padding: '0.85rem 1rem',
        margin: '1rem 0',
      }}
    >
      {title ? (
        <p style={{ margin: '0 0 0.35rem 0', fontWeight: 700 }}>{title}</p>
      ) : null}
      <div>{children}</div>
    </div>
  );
}
