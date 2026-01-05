export default function CourseSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 animate-pulse">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-800 rounded w-1/2" />

        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-900 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
