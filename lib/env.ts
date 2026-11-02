// Reads a required setting and fails with a message that names it, instead of a vague crash later.
export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing setting ${name}. Add it in Vercel → Settings → Environment Variables.`);
  return value;
}
