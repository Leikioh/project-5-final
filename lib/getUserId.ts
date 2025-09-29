import { cookies } from "next/headers";

export async function getUserId(): Promise<number | null> {
  const jar = await cookies();
  const raw = jar.get("userId")?.value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

export async function requireUserId(): Promise<number> {
  const id = await getUserId();
  if (id == null) {
    throw new Error("UNAUTHENTICATED");
  }
  return id;
}
