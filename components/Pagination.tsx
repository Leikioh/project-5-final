import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center mt-10 space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-orange-500 hover:text-white disabled:opacity-50"
      >
        «
      </button>
      {pages.map((n) => (
        <button
          key={n}
          onClick={() => onPageChange(n)}
          className={`px-3 py-1 rounded ${
            n === currentPage
              ? "bg-orange-500 text-white"
              : "bg-gray-100 hover:bg-orange-500 hover:text-white"
          }`}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-orange-500 hover:text-white disabled:opacity-50"
      >
        »
      </button>
    </div>
  );
};

export default Pagination;
