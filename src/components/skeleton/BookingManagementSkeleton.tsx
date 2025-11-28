import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SkeletonBox = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded ${className}`} />
);

const BookingCardSkeleton = () => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-6 w-32" />
        <SkeletonBox className="h-6 w-20" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-4 w-2/3" />
        <SkeletonBox className="h-4 w-full" />
      </div>
      
      <div className="pt-2 border-t space-y-2">
        <div className="flex justify-between">
          <SkeletonBox className="h-4 w-16" />
          <SkeletonBox className="h-4 w-12" />
        </div>
        <div className="flex justify-between">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-4 w-20" />
        </div>
        <div className="flex justify-between">
          <SkeletonBox className="h-4 w-20" />
          <SkeletonBox className="h-4 w-32" />
        </div>
      </div>

      <div className="flex gap-2">
        <SkeletonBox className="h-9 flex-1" />
        <SkeletonBox className="h-9 flex-1" />
      </div>
    </CardContent>
  </Card>
);

export default function BookingManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-9 w-64" />
          <SkeletonBox className="h-5 w-80" />
        </div>
        <SkeletonBox className="h-10 w-36" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <SkeletonBox className="h-4 w-24" />
              <SkeletonBox className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Bar */}
      <SkeletonBox className="h-10 w-full" />

      {/* Tabs and Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" disabled>
            <SkeletonBox className="h-4 w-16" />
          </TabsTrigger>
          <TabsTrigger value="confirmed" disabled>
            <SkeletonBox className="h-4 w-20" />
          </TabsTrigger>
          <TabsTrigger value="pending" disabled>
            <SkeletonBox className="h-4 w-16" />
          </TabsTrigger>
          <TabsTrigger value="completed" disabled>
            <SkeletonBox className="h-4 w-20" />
          </TabsTrigger>
          <TabsTrigger value="cancelled" disabled>
            <SkeletonBox className="h-4 w-18" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}