export function apiPath(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
