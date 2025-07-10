import { Skeleton } from "@/components/ui/skeleton";

export const PageLoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Skeleton className="h-8 w-32" />
            <div className="hidden md:flex space-x-8">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="relative min-h-screen bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
            <Skeleton className="h-12 w-96 mx-auto" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-80 mx-auto" />
            <Skeleton className="h-12 w-48 mx-auto" />
          </div>
        </div>
      </div>

      {/* Section skeletons */}
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        {[1, 2, 3].map((section) => (
          <div key={section} className="space-y-8">
            <Skeleton className="h-8 w-64 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((card) => (
                <div key={card} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};