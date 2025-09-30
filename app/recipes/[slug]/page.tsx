import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { apiPath } from "@/lib/api";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://project-5-final.vercel.app/";
  const recipe = await prisma.recipe.findUnique({
    where: { slug: params.slug },
    select: { title: true, description: true, imageUrl: true, updatedAt: true },
  });

  const title = recipe ? `${recipe.title} | CookHub` : "Recette | CookHub";
  const description =
    (recipe?.description ?? "Découvrez une délicieuse recette sur CookHub.").slice(0, 155);

  const url = `${baseUrl}/recipes/${params.slug}`;
  const image = recipe?.imageUrl ?? `${baseUrl}/images/og-default.jpg`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: "article",
      images: [{ url: image }],
      siteName: "CookHub",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
