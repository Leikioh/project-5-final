import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Empêche les appels hors bornes / redondants
  const go = (p: number) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    onPageChange(p);
  };

  return (
    <nav
      className="mt-10 flex justify-center"
      aria-label="Pagination"
    >
      <ul className="inline-flex items-center gap-2">
        {/* Précédent */}
        <li>
          <button
            type="button"
            onClick={() => go(currentPage - 1)}
            disabled={currentPage === 1}
            aria-disabled={currentPage === 1}
            aria-label="Page précédente"
            className={[
              "min-w-[44px] h-11 px-3 rounded-lg border text-base font-medium",
              "bg-white text-gray-900 border-gray-300 hover:bg-gray-100",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <span aria-hidden="true">«</span>
            <span className="sr-only">Précédent</span>
          </button>
        </li>

        {/* Pages */}
        {pages.map((n) => {
          const isActive = n === currentPage;
          return (
            <li key={n}>
              <button
                type="button"
                onClick={() => go(n)}
                aria-label={`Aller à la page ${n}`}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "min-w-[44px] h-11 px-3 rounded-lg border text-base font-semibold",
                  isActive
                    ? "bg-orange-600 text-white border-transparent"
                    : "bg-white text-gray-900 border-gray-300 hover:bg-gray-100",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2",
                ].join(" ")}
              >
                {n}
              </button>
            </li>
          );
        })}

        {/* Suivant */}
        <li>
          <button
            type="button"
            onClick={() => go(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-disabled={currentPage === totalPages}
            aria-label="Page suivante"
            className={[
              "min-w-[44px] h-11 px-3 rounded-lg border text-base font-medium",
              "bg-white text-gray-900 border-gray-300 hover:bg-gray-100",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <span aria-hidden="true">»</span>
            <span className="sr-only">Suivant</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
