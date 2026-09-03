/** Fills {name} placeholders. Kept trivial on purpose — the dictionaries only
 *  ever interpolate counts, and a template engine would be more to go wrong. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
}
