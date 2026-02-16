interface DocMetaProps {
  source: string;
  scope: 'canonical' | 'supplemental';
  rewritten?: boolean;
}

export function DocMeta({ source, scope, rewritten = true }: DocMetaProps) {
  const scopeLabel = scope === 'canonical' ? 'Canonical source' : 'Supplemental source';

  return (
    <div
      style={{
        border: '1px solid var(--fd-border)',
        borderRadius: 12,
        padding: '0.85rem 1rem',
        margin: '0 0 1.25rem 0',
        background: 'var(--fd-card)',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
        <strong>{scopeLabel}:</strong> <code>{source}</code>
        {rewritten ? <span> · rewritten for docs app MDX</span> : null}
      </p>
    </div>
  );
}
