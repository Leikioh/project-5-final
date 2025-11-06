"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type ApiCreated = { id: number; slug: string | null };

// Limites raisonnables
const MAX_TITLE = 200;
const MAX_ING = 200;   // un ingrédient
const MAX_STEP = 4000; // étape
const MAX_DESC = 10000;

type FileState = {
  file: File | null;
  previewUrl: string | null; // blob: URL
};

export default function NewRecipeForm(): React.JSX.Element {
  const router = useRouter();

  const [title, setTitle] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [activeTime, setActiveTime] = React.useState<string>("");
  const [totalTime, setTotalTime] = React.useState<string>("");
  const [yieldQty, setYieldQty] = React.useState<string>("");

  const [ingredients, setIngredients] = React.useState<string[]>([""]);
  const [steps, setSteps] = React.useState<string[]>([""]);

  const [image, setImage] = React.useState<FileState>({ file: null, previewUrl: null });
  const prevPreviewRef = React.useRef<string | null>(null);

  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Libère l'URL blob précédente quand elle change et au démontage
  React.useEffect(() => {
    const prev = prevPreviewRef.current;
    if (prev && prev !== image.previewUrl) {
      URL.revokeObjectURL(prev);
    }
    prevPreviewRef.current = image.previewUrl;

    return () => {
      if (prevPreviewRef.current) {
        URL.revokeObjectURL(prevPreviewRef.current);
        prevPreviewRef.current = null;
      }
    };
  }, [image.previewUrl]);

  const onPickImage: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.currentTarget.files?.[0] ?? null;

    if (!file) {
      setImage({ file: null, previewUrl: null });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Le fichier sélectionné doit être une image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("L’image ne doit pas dépasser 10 Mo.");
      return;
    }

    const url = URL.createObjectURL(file);
    setError(null);
    setImage({ file, previewUrl: url });
  };

  // Helpers typés correctement
  const updateArrayItem = (
    index: number,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => {
      const next = prev.slice();
      next[index] = value;
      return next;
    });
  };

  const addRow = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, ""]);
  };

  const removeRow = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""]; // garde au moins un champ
    });
  };

  const validate = (): string | null => {
    const t = title.trim();
    if (t.length < 3) return "Le titre doit contenir au moins 3 caractères.";
    if (t.length > MAX_TITLE) return `Le titre ne doit pas dépasser ${MAX_TITLE} caractères.`;

    const ing = ingredients.map((s) => s.trim()).filter(Boolean);
    if (ing.length === 0) return "Ajoutez au moins 1 ingrédient.";
    if (ing.some((s) => s.length > MAX_ING))
      return `Chaque ingrédient doit faire moins de ${MAX_ING} caractères.`;

    const stp = steps.map((s) => s.trim()).filter(Boolean);
    if (stp.length === 0) return "Ajoutez au moins 1 étape.";
    if (stp.some((s) => s.length > MAX_STEP))
      return `Chaque étape doit faire moins de ${MAX_STEP} caractères.`;

    if (description.trim().length > MAX_DESC)
      return `La description est trop longue (max ${MAX_DESC}).`;

    return null;
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);

    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    // Construit FormData pour multipart (attendu par /api/recipes)
    const form = new FormData();
    form.set("title", title.trim());
    if (description.trim()) form.set("description", description.trim());
    if (activeTime.trim()) form.set("activeTime", activeTime.trim());
    if (totalTime.trim()) form.set("totalTime", totalTime.trim());
    if (yieldQty.trim()) form.set("yield", yieldQty.trim());

    ingredients
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((ing) => form.append("ingredients[]", ing));

    steps
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((st) => form.append("steps[]", st));

    if (image.file) {
      form.append("image", image.file);
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        credentials: "include",
        body: form, // pas d’en-tête Content-Type manuel !
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Échec de la création (${res.status}) ${txt}`);
      }

      const created = (await res.json()) as ApiCreated;
      const dest =
        created.slug && created.slug.trim()
          ? `/recipes/${created.slug}`
          : `/recipes/${created.id}`;
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de création.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Titre *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          required
          maxLength={MAX_TITLE}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Ex: Pasta alla Vodka"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          rows={4}
          maxLength={MAX_DESC}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Décrivez rapidement la recette…"
        />
      </div>

      {/* Image Upload (fichier) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Image (fichier)
        </label>
        <div className="mt-1 flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={onPickImage}
            className="block w-full text-black file:mr-3 file:rounded-md file:border file:px-3 file:py-2 file:bg-white file:text-gray-700 hover:file:bg-gray-50"
          />
          {image.previewUrl && (
            <Image
              src={image.previewUrl}
              alt="Prévisualisation"
              width={80}
              height={80}
              className="h-20 w-20 rounded object-cover border"
              unoptimized
              priority
            />
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">JPG/PNG/WebP/AVIF, 10&nbsp;Mo max.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="activeTime" className="block text-sm font-medium text-gray-700">
            Active time
          </label>
          <input
            id="activeTime"
            type="text"
            value={activeTime}
            onChange={(e) => setActiveTime(e.currentTarget.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ex: 20 min"
          />
        </div>
        <div>
          <label htmlFor="totalTime" className="block text-sm font-medium text-gray-700">
            Total time
          </label>
          <input
            id="totalTime"
            type="text"
            value={totalTime}
            onChange={(e) => setTotalTime(e.currentTarget.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ex: 45 min"
          />
        </div>
        <div>
          <label htmlFor="yield" className="block text-sm font-medium text-gray-700">
            Yield
          </label>
          <input
            id="yield"
            type="text"
            value={yieldQty}
            onChange={(e) => setYieldQty(e.currentTarget.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ex: 4 servings"
          />
        </div>
      </div>

      {/* Ingrédients */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">Ingrédients *</legend>
        <div className="mt-2 space-y-2">
          {ingredients.map((ing, i) => (
            <div key={`ing-${i}`} className="flex gap-2">
              <input
                type="text"
                value={ing}
                onChange={(e) =>
                  updateArrayItem(i, e.currentTarget.value.slice(0, MAX_ING), setIngredients)
                }
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={`Ingrédient #${i + 1}`}
              />
              <button
                type="button"
                onClick={() => removeRow(i, setIngredients)}
                className="px-3 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
                aria-label={`Supprimer l’ingrédient ${i + 1}`}
              >
                −
              </button>
              {i === ingredients.length - 1 && (
                <button
                  type="button"
                  onClick={() => addRow(setIngredients)}
                  className="px-3 py-2 rounded-md bg-gray-900 text-white hover:bg-black"
                >
                  + Ajouter
                </button>
              )}
            </div>
          ))}
        </div>
      </fieldset>

      {/* Étapes */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">Étapes *</legend>
        <div className="mt-2 space-y-2">
          {steps.map((st, i) => (
            <div key={`step-${i}`} className="flex gap-2">
              <textarea
                value={st}
                onChange={(e) =>
                  updateArrayItem(i, e.currentTarget.value.slice(0, MAX_STEP), setSteps)
                }
                rows={2}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={`Étape #${i + 1}`}
              />
              <button
                type="button"
                onClick={() => removeRow(i, setSteps)}
                className="px-3 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
                aria-label={`Supprimer l’étape ${i + 1}`}
              >
                −
              </button>
              {i === steps.length - 1 && (
                <button
                  type="button"
                  onClick={() => addRow(setSteps)}
                  className="px-3 py-2 rounded-md bg-gray-900 text-white hover:bg-black"
                >
                  + Ajouter
                </button>
              )}
            </div>
          ))}
        </div>
      </fieldset>

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-orange-500 px-5 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {submitting ? "Création…" : "Créer la recette"}
        </button>
      </div>
    </form>
  );
}
