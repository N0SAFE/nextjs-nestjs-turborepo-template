type ConflictWarningScope = 'hooks' | 'query keys';

function getDuplicates(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

export function warnOnConflicts(values: readonly string[], scope: ConflictWarningScope): void {
  const uniqueValues = new Set(values);
  if (values.length === uniqueValues.size) {
    return;
  }

  const duplicates = getDuplicates(values);
  const resolution = scope === 'hooks'
    ? 'Later hooks will override earlier ones.'
    : 'Custom keys will override router keys.';

  console.warn(
    `[mergeHooks] Warning: Duplicate ${scope} detected: ${duplicates.join(', ')}. ${resolution}`
  );
}
