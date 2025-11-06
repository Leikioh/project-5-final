// app/recipes/new/page.tsx
import type { Metadata } from "next";
import NewRecipeForm from "@/components/NewRecipeForm";

export const metadata: Metadata = {
  title: "Créer une recette | CookHub",
  description: "Ajoutez une nouvelle recette avec ingrédients, étapes et temps de préparation.",
  robots: { index: false, follow: true }, // la page de création n’a pas besoin d’être indexée
};

export default function NewRecipePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Créer une recette</h1>
      <NewRecipeForm />
    </main>
  );
}
