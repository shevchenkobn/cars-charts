export function mathSignedCeil(value: number) {
  return value < 0 ? Math.floor(value) : Math.ceil(value);
}
