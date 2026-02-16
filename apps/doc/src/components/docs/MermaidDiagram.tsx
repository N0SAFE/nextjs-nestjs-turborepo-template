'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface MermaidDiagramProps {
  chart: string;
  title?: string;
  caption?: string;
}

function normalizeChart(chart: string): string {
  return chart
    .replace(/\t/g, '  ')
    .trim();
}

export function MermaidDiagram({ chart, title, caption }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);

  const normalizedChart = useMemo(() => normalizeChart(chart), [chart]);

  useEffect(() => {
    let isMounted = true;

    async function render() {
      const container = containerRef.current;
      if (!container) return;

      setIsRendering(true);
      setError(null);

      try {
        const mermaid = (await import('mermaid')).default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'neutral',
        });

        const renderId = `doc-mermaid-${Math.random().toString(36).slice(2, 10)}`;
        const { svg } = await mermaid.render(renderId, normalizedChart);

        if (!isMounted) return;
        container.innerHTML = svg;
      } catch (caughtError) {
        if (!isMounted) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Mermaid render failed');
      } finally {
        if (isMounted) {
          setIsRendering(false);
        }
      }
    }

    void render();

    return () => {
      isMounted = false;
    };
  }, [normalizedChart]);

  return (
    <figure
      style={{
        border: '1px solid var(--fd-border)',
        borderRadius: 14,
        margin: '1.25rem 0',
        overflow: 'hidden',
        background: 'var(--fd-card)',
      }}
    >
      {(title || caption) ? (
        <figcaption
          style={{
            borderBottom: '1px solid var(--fd-border)',
            padding: '0.75rem 1rem',
            background: 'color-mix(in oklab, var(--fd-card) 90%, var(--fd-accent) 10%)',
          }}
        >
          {title ? <p style={{ margin: 0, fontWeight: 700 }}>{title}</p> : null}
          {caption ? (
            <p style={{ margin: title ? '0.2rem 0 0 0' : 0, opacity: 0.85, fontSize: '0.92rem' }}>
              {caption}
            </p>
          ) : null}
        </figcaption>
      ) : null}

      <div style={{ padding: '1rem' }}>
        {error ? (
          <div>
            <p style={{ margin: '0 0 0.6rem 0', color: '#ef4444', fontWeight: 600 }}>
              Mermaid rendering error
            </p>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.92rem' }}>{error}</p>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{normalizedChart}</code>
            </pre>
          </div>
        ) : (
          <>
            <div
              ref={containerRef}
              style={{
                minHeight: 72,
                display: 'grid',
                placeItems: 'center',
              }}
            />
            {isRendering ? (
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.75, fontSize: '0.9rem' }}>
                Rendering diagram…
              </p>
            ) : null}
          </>
        )}
      </div>
    </figure>
  );
}