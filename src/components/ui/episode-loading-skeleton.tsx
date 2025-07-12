import { Skeleton } from "@/components/ui/skeleton";

export const EpisodeLoadingSkeleton = () => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Episode Header */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>

      {/* Episode List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="card-interactive space-y-4 p-6 border rounded-lg">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EpisodeDetailSkeleton = () => {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Episode Hero */}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <Skeleton className="aspect-square w-full rounded-lg" />
      </div>

      {/* Episode Content */}
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>

      {/* Show Notes */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-6 w-16 shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};