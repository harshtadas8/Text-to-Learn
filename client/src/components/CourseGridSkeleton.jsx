export default function CourseGridSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="h-10 bg-gray-900 rounded w-48 mb-8 animate-pulse" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-32"
            >
              <div className="h-6 bg-gray-800 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-4" />
              <div className="h-3 bg-gray-800 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
