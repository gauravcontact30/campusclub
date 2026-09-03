/**
 * Zod issues flattened to the `{ field: message }` shape the form components
 * read. Lives outside the `'use server'` files because a server-action module
 * may only export async functions.
 */
export function fieldErrors(error: { issues: { path: (string | number)[]; message: string }[] }) {
  return Object.fromEntries(error.issues.map((i) => [String(i.path[0]), i.message]));
}
