// Toujours retourner un chemin absolu côté client.
// Si NEXT_PUBLIC_API_URL est défini, on le préfixe proprement (sans double slash)
// et SANS jamais insérer "undefined".
export function apiPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const baseRaw = process.env.NEXT_PUBLIC_API_URL;
  const base =
    typeof baseRaw === "string" && baseRaw.trim().length > 0
      ? baseRaw.replace(/\/+$/, "")
      : "";
  return `${base}${p}`;
}
