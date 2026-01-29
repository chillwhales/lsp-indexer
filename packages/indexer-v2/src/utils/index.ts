export function isNumeric(value: string) {
  if (typeof value != 'string') return false;
  return !isNaN(value as any) && !isNaN(parseFloat(value));
}
