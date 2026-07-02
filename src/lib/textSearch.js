// Builds a prefix-matching tsquery string so partial/incomplete words still match,
// e.g. "toa" -> "toa:*" matches "toán". Combined with the `vietnamese` text search
// config (unaccent-based) on the server, this also makes search accent-insensitive.
export function toPrefixQuery(input) {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.replace(/[&|!():*]/g, '')}:*`)
    .join(' & ')
}
