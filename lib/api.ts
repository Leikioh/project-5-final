export function apiPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const baseRaw = process.env.NEXT_PUBLIC_API_URL;
  const base =
    typeof baseRaw === "string" && baseRaw.trim().length > 0
      ? baseRaw.replace(/\/+$/, "")
      : "";
  return `${base}${p}`;
}
