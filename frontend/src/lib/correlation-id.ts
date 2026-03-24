export function createCorrelationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  const seed = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1e9).toString(36);
  return `${seed}-${rand}`;
}
