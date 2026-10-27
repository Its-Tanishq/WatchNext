export default function Loading() {
  return (
    <div className="min-h-screen bg-[#07090e] text-[#e8ebf2] animate-pulse">
      {/* Hero Backdrop Skeleton */}
      <div className="w-full h-72 md:h-96 bg-[#121622] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-transparent" />
      </div>

      {/* Main Details Skeleton Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-32 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Cover Image Skeleton */}
          <div className="w-52 h-72 sm:w-64 sm:h-92 rounded-2xl bg-[#171c2b] shadow-2xl flex-shrink-0" />

          {/* Details Skeleton */}
          <div className="flex-1 space-y-4 pt-6 md:pt-16 w-full">
            <div className="h-8 bg-[#1a2133] rounded-lg w-3/4" />
            <div className="h-4 bg-[#141a29] rounded w-1/2" />
            
            <div className="flex gap-2 pt-2">
              <div className="h-6 w-16 bg-[#1a2133] rounded-full" />
              <div className="h-6 w-20 bg-[#1a2133] rounded-full" />
              <div className="h-6 w-16 bg-[#1a2133] rounded-full" />
            </div>

            <div className="space-y-2 pt-4">
              <div className="h-4 bg-[#141a29] rounded w-full" />
              <div className="h-4 bg-[#141a29] rounded w-5/6" />
              <div className="h-4 bg-[#141a29] rounded w-4/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
