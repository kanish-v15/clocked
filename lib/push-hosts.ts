// Only real push services may be stored or sent to. Without this check, anyone could register a web
// address of their choosing, and the server would send requests to it every night.
const EXACT = new Set(["fcm.googleapis.com", "updates.push.services.mozilla.com"]);
const SUFFIXES = [".push.apple.com", ".notify.windows.com"];

export function isPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  return EXACT.has(host) || SUFFIXES.some(s => host.endsWith(s));
}
