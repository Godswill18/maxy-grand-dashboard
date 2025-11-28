import React from 'react'
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

const CalendarSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
          
          .calendar-header {
            font-family: 'Playfair Display', serif;
          }
          
          .calendar-body {
            font-family: 'DM Sans', sans-serif;
          }

          .skeleton-pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }
        `}</style>

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-12 w-64 calendar-header skeleton-pulse mb-2" />
              <Skeleton className="h-5 w-48 calendar-body skeleton-pulse" />
            </div>
            <Skeleton className="h-10 w-24 skeleton-pulse" />
          </div>

          {/* Legend Skeleton */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 items-center">
                <Skeleton className="h-4 w-24 skeleton-pulse" />
                <div className="flex gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-full skeleton-pulse" />
                      <Skeleton className="h-4 w-16 skeleton-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Navigation Skeleton */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-10 w-10 rounded skeleton-pulse" />
                <Skeleton className="h-8 w-48 calendar-header skeleton-pulse mx-auto" />
                <Skeleton className="h-10 w-10 rounded skeleton-pulse" />
              </div>

              {/* Calendar Grid Skeleton */}
              <div className="calendar-body">
                {/* Day Headers Skeleton */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full skeleton-pulse" />
                  ))}
                </div>

                {/* Calendar Days Skeleton */}
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 42 }).map((_, i) => (
                    <div key={i} className="min-h-[120px] p-2 border-2 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <Skeleton className="h-4 w-6 mb-2 skeleton-pulse" />
                      <div className="space-y-1 max-h-[80px]">
                        {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, j) => (
                          <Skeleton key={j} className="h-6 w-full mb-1 skeleton-pulse" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <CardContent className="p-4">
                  <Skeleton className="h-12 w-12 rounded-full mx-auto mb-3 skeleton-pulse" />
                  <Skeleton className="h-4 w-20 mx-auto skeleton-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
};

export default CalendarSkeleton