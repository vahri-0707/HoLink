const applicationRoot = new URL('../', import.meta.url);

/** Keep saved /assets references portable between localhost and a Pages project URL. */
export function assetUrl(value, root = applicationRoot) {
  return typeof value === 'string' && value.startsWith('/assets/')
    ? new URL(value.slice(1), root).href
    : value;
}
