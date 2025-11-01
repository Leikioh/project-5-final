import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const admin = await requireAdmin();
  if (!admin) return <p className="text-red-600">Forbidden</p>;

  const [pending, recipes, comments] = await Promise.all([
    prisma.recipe.count({ where: { status: "PENDING", deletedAt: null } }),
    prisma.recipe.count({ where: { deletedAt: null } }),
    prisma.comment.count({ where: { deletedAt: null } }),
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card label="Recettes (total)" value={recipes} />
      <Card label="En attente" value={pending} />
      <Card label="Commentaires" value={comments} />
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-slate-500 text-sm">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
