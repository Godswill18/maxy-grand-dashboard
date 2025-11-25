import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

// Loading Skeleton
export const BookingCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const CalendarSkeleton = () => (
  <Card className="p-6">
    <div className="flex justify-between mb-4">
      <Skeleton className="h-6 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-md" />
      ))}
    </div>
  </Card>
);