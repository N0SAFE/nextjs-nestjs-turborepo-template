interface DocChecklistProps {
  items: {
    label: string;
    done?: boolean;
  }[];
}

export function DocChecklist({ items }: DocChecklistProps) {
  return (
    <ul style={{ listStyle: 'none', paddingLeft: 0, margin: '0.75rem 0' }}>
      {items.map((item) => (
        <li
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: '0.4rem 0',
          }}
        >
          <span aria-hidden>{item.done ? '✅' : '⬜'}</span>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
