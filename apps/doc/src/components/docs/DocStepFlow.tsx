export interface DocStep {
  title: string;
  description: string;
}

export interface DocStepFlowProps {
  steps: DocStep[];
}

export function DocStepFlow({ steps }: DocStepFlowProps) {
  return (
    <ol style={{ paddingLeft: 0, listStyle: 'none', margin: '1rem 0' }}>
      {steps.map((step, index) => (
        <li
          key={`${String(index)}-${step.title}`}
          style={{
            border: '1px solid var(--fd-border)',
            borderRadius: 12,
            padding: '0.8rem 0.9rem',
            marginBottom: '0.65rem',
            background: 'var(--fd-card)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 700 }}>
            {index + 1}. {step.title}
          </p>
          <p style={{ margin: '0.35rem 0 0 0', opacity: 0.9 }}>{step.description}</p>
        </li>
      ))}
    </ol>
  );
}