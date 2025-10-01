// app/recipes/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import LikeButton from "@/components/LikeButton";
import CommentsPanel from "@/components/CommentsPanel";
import Footer from "@/components/Footer";
import { FaClock, FaUtensils } from "react-icons/fa";

export const runtime = "nodejs";

/* ───────────────────────── Helpers ───────────────────────── */

async function getRecipeBySlugOrId(slugOrId: string) {
  const asNumber = Number(slugOrId);
  const where = Number.isFinite(asNumber) ? { id: asNumber } : { slug: slugOrId };

  // On n'utilise pas `select` volontairement : on récupère les scalaires + include relations
  return prisma.recipe.findUnique({
    where,
    include: {
      author: { select: { id: true, name: true } },
      steps: { orderBy: { id: "asc" } },
      ingredients: { orderBy: { id: "asc" } },
      _count: { select: { favorites: true, comments: true } },
    },
  });
}

async function getSimilarRecipes(currentId: number) {
  return prisma.recipe.findMany({
    where: { id: { not: currentId } },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      title: true,
      imageUrl: true,
      slug: true,
      author: { select: { id: true, name: true } },
    },
  });
}

/* ───────────────────────── Metadata ───────────────────────── */

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const fallbackTitle = "Recette — CookHub";
  const fallbackDesc = "Découvrez une délicieuse recette sur CookHub.";

  const asNumber = Number(slug);
  const where = Number.isFinite(asNumber) ? { id: asNumber } : { slug };

  const recipe = await prisma.recipe.findUnique({
    where,
    select: {
      title: true,
      description: true,
      imageUrl: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
  });

  const title = recipe?.title ?? fallbackTitle;
  const description = (recipe?.description ?? fallbackDesc).slice(0, 155);
  const slugForUrl = recipe?.slug ?? slug;
  const url = `${baseUrl}/recipes/${slugForUrl}`;
  const image = recipe?.imageUrl ?? `${baseUrl}/images/og-default.jpg`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      authors: recipe?.author?.name ? [recipe.author.name] : undefined,
      publishedTime: recipe?.createdAt?.toISOString(),
      modifiedTime: recipe?.updatedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
  };
}

/* ───────────────────────── Page ───────────────────────── */

export default async function RecipePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const recipe = await getRecipeBySlugOrId(slug);
  if (!recipe) return notFound();

  // Redirection canonique si l’URL demandée est un ID numérique
  const isNumeric = Number.isFinite(Number(slug));
  if (isNumeric && recipe.slug && recipe.slug !== slug) {
    redirect(`/recipes/${recipe.slug}`);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const favoritesCount = recipe._count?.favorites ?? 0;
  const similar = await getSimilarRecipes(recipe.id);

  // JSON-LD Recipe
  const recipeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description ?? undefined,
    image: recipe.imageUrl ? [recipe.imageUrl] : undefined,
    author: recipe.author?.name ? { "@type": "Person", name: recipe.author.name } : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    datePublished: (recipe as any).createdAt?.toISOString?.(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dateModified: (recipe as any).updatedAt?.toISOString?.(),
    prepTime: recipe.activeTime ?? undefined,
    totalTime: recipe.totalTime ?? undefined,
    recipeYield: recipe.yield ?? undefined,
    recipeIngredient: recipe.ingredients.map(i => i.name),
    recipeInstructions: recipe.steps.map(s => ({ "@type": "HowToStep", text: s.text })),
  };

  // JSON-LD Breadcrumb
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
      { "@type": "ListItem", position: 2, name: "Recipes", item: `${baseUrl}/recipes` },
      { "@type": "ListItem", position: 3, name: recipe.title, item: `${baseUrl}/recipes/${recipe.slug ?? recipe.id}` },
    ],
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd) }}
      />
      <script
        type="application/ld+json"
       
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Image + bouton Like */}
        <div className="relative w-full h-[400px] rounded-lg overflow-hidden mb-8 shadow-lg">
          <Image
            src={recipe.imageUrl ?? "/images/placeholder.jpg"}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
          />
          <div className="absolute top-4 right-4">
            <LikeButton
              recipeSlug={recipe.slug ?? String(recipe.id)}
              className="bg-black/40 hover:bg-black/50"
            />
          </div>
        </div>

        {/* Titre / Auteur / Compteurs */}
        <header className="mb-6">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">{recipe.title}</h1>
          <p className="text-gray-600">
            by{" "}
            {recipe.author?.id ? (
              <Link href={`/users/${recipe.author.id}`} className="text-orange-600 hover:underline">
                {recipe.author?.name ?? "Anonyme"}
              </Link>
            ) : (
              recipe.author?.name ?? "Anonyme"
            )}
          </p>
          <div className="mt-2 text-sm text-gray-500">
            {favoritesCount} favorite{favoritesCount > 1 ? "s" : ""} ·{" "}
            {(recipe._count?.comments ?? 0)} comment{(recipe._count?.comments ?? 0) > 1 ? "s" : ""}
          </div>
        </header>

        {/* Description */}
        {recipe.description && (
          <p className="text-lg text-gray-800 mb-8">{recipe.description}</p>
        )}

        {/* Stats (temps/rendement) + compteur favoris */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="md:col-span-3">
            <div className="flex flex-wrap gap-6 my-4 text-gray-700">
              <div className="flex items-center gap-2">
                <FaClock className="text-orange-500" />
                <span>Active time: {recipe.activeTime ?? "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="text-orange-500" />
                <span>Total time: {recipe.totalTime ?? "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaUtensils className="text-orange-500" />
                <span>Yield: {recipe.yield ?? "-"}</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded shadow text-center">
            <p className="text-orange-500 text-sm font-bold">Favorites</p>
            <p className="text-lg font-semibold text-gray-800">{favoritesCount}</p>
          </div>
        </section>

        {/* Étapes + Ingrédients */}
        <div className="flex flex-col md:flex-row gap-8">
          <section className="flex-1">
            <h2 className="text-2xl text-gray-700 font-bold mb-4">How to Make It</h2>
            {(recipe.steps?.length ?? 0) === 0 ? (
              <p className="text-gray-500">No steps provided.</p>
            ) : (
              <ol className="list-decimal list-inside space-y-3">
                {recipe.steps!.map((s) => (
                  <li key={s.id} className="text-gray-800">
                    {s.text}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <aside className="w-full md:w-72 bg-white shadow rounded-lg p-6">
            <h2 className="text-xl text-gray-700 font-bold mb-4">Ingredients</h2>
            {(recipe.ingredients?.length ?? 0) === 0 ? (
              <p className="text-gray-500">No ingredients provided.</p>
            ) : (
              <ul className="list-disc list-inside space-y-2">
                {recipe.ingredients!.map((i) => (
                  <li key={i.id} className="text-gray-800">
                    {i.name}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        {/* Commentaires */}
        <section className="mt-12">
          <h2 className="text-2xl text-black font-bold mb-4">Comments</h2>
          <CommentsPanel recipeId={recipe.id} />
        </section>

        {/* Recettes similaires */}
        {similar.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Similar recipes</h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((r) => (
                <Link key={r.id} href={`/recipes/${r.slug}`} className="block group">
                  <div className="bg-white rounded-lg h-[260px] shadow hover:shadow-lg transition overflow-hidden">
                    <div className="relative h-40">
                      <Image
                        src={r.imageUrl ?? "/images/placeholder.jpg"}
                        alt={r.title}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition"
                        sizes="(max-width: 1024px) 50vw, 300px"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-500 mb-1">{r.author?.name ?? "Anonyme"}</p>
                      <h3 className="text-base font-semibold text-gray-800 line-clamp-2">{r.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer global */}
      <Footer />
    </>
  );
}
