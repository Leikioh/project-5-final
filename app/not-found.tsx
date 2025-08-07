import Image from "next/image";
import chef404 from "@/public/images/404.png";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 text-center px-4">
      <Image
        src={chef404}
        alt="Chef lost in the kitchen"
        width={300}
        height={300}
        priority
        className="mb-6 animate-bounce"
      />
      <h1 className="text-5xl font-bold text-orange-600">Oups, c&apos;est brûlé !</h1>
      <p className="text-gray-700 mt-4 text-lg max-w-md">
        La recette que vous cherchez n&apos;existe pas ou a été mangée par un chef trop curieux...
      </p>
      <Link
        href="/"
        className="mt-6 inline-block bg-orange-500 text-white px-6 py-3 rounded-lg shadow hover:bg-orange-400 transition"
      >
        Retour à la cuisine 🍳
      </Link>
    </div>
  );
}