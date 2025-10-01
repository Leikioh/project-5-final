// scripts/backfill-slugs.ts
import prisma from "@/lib/prisma";

// petit slugify simple
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function makeUniqueSlug(base: string): Promise<string> {
  const baseSlug = slugify(base) || "recette";
  let slug = baseSlug;
  let i = 1;
  // tant que collision, suffixe -2, -3, ...
  while (true) {
    const exists = await prisma.recipe.findUnique({ where: { slug } });
    if (!exists) return slug;
    i += 1;
    slug = `${baseSlug}-${i}`;
  }
}

async function run() {
  const rows = await prisma.recipe.findMany({ where: { slug: null }, select: { id: true, title: true } });
  for (const r of rows) {
    const slug = await makeUniqueSlug(r.title ?? `recette-${r.id}`);
    await prisma.recipe.update({ where: { id: r.id }, data: { slug } });
    console.log(`Recipe ${r.id} -> ${slug}`);
  }
}

run().then(() => {
  console.log("Done");
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
