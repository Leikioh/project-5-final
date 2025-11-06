// app/admin/loading.tsx
export default function LoadingAdmin() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-7 w-64 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded" />
        ))}
      </div>
      <div className="h-6 w-56 bg-gray-200 rounded mb-3" />
      <div className="h-40 bg-gray-100 rounded" />
    </div>
  );
}
