import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  X,
  Search,
  AlertCircle,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { useReviewState, useReviewActions } from "@/store/useReviewStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const RATING_BORDER: Record<number, string> = {
  5: "border-l-green-400",
  4: "border-l-blue-400",
  3: "border-l-amber-400",
  2: "border-l-orange-400",
  1: "border-l-red-400",
};

const RATING_BAR: Record<number, string> = {
  5: "bg-green-400",
  4: "bg-blue-400",
  3: "bg-amber-400",
  2: "bg-orange-400",
  1: "bg-red-400",
};

// ── Stars ─────────────────────────────────────────────────────────────────────

const Stars = ({
  rating,
  size = "h-4 w-4",
}: {
  rating: number;
  size?: string;
}) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={cn(
          size,
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
        )}
      />
    ))}
  </div>
);

// ── Loading skeleton ──────────────────────────────────────────────────────────

const CardSkeleton = () => (
  <Card className="border-l-4 border-l-muted">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </CardContent>
  </Card>
);

// ── Main component ─────────────────────────────────────────────────────────────

export default function Reviews() {
  const {
    reviews,
    hotels,
    selectedHotelId,
    ratingFilter,
    startDate,
    endDate,
    isLoading,
    error,
  } = useReviewState();

  const { fetchHotels, fetchReviews, setHotelFilter, setRatingFilter, setDateRange } =
    useReviewActions();

  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  useEffect(() => {
    if (user) fetchReviews(role);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived stats ──────────────────────────────────────────────────────────

  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((r) => r.rating === star).length;
        return {
          star,
          count,
          pct: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0,
        };
      }),
    [reviews]
  );

  const avgRating = useMemo(
    () =>
      reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : "—",
    [reviews]
  );

  const recommendPct = useMemo(() => {
    const count = reviews.filter((r) => r.wouldRecommend === true).length;
    return reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
  }, [reviews]);

  const fiveStarPct = useMemo(() => {
    const count = reviews.filter((r) => r.rating === 5).length;
    return reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
  }, [reviews]);

  // ── Client-side search filter ─────────────────────────────────────────────

  const displayedReviews = useMemo(() => {
    if (!searchQuery.trim()) return reviews;
    const q = searchQuery.toLowerCase();
    return reviews.filter(
      (r) =>
        r.guestName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q)
    );
  }, [reviews, searchQuery]);

  const hasActiveFilters =
    ratingFilter !== null || startDate !== "" || endDate !== "" || searchQuery !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setDateRange("", "", role);
    setRatingFilter(null, role);
  };

  const userHotelName =
    role === "admin"
      ? hotels.find((h) => h._id === user?.hotelId)?.name || "Your Branch"
      : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Guest Reviews</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {displayedReviews.length} review{displayedReviews.length !== 1 ? "s" : ""}
          {hasActiveFilters ? ` · filtered from ${reviews.length}` : ""}
        </p>
      </div>

      {/* ── Stats Panel ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Rating distribution */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {isLoading && reviews.length === 0
              ? [5, 4, 3, 2, 1].map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <Skeleton className="h-3.5 w-20 shrink-0" />
                    <Skeleton className="h-2 flex-1 rounded-full" />
                    <Skeleton className="h-3.5 w-8 shrink-0" />
                  </div>
                ))
              : distribution.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-14 shrink-0">
                      <span className="text-sm font-medium w-3">{star}</span>
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", RATING_BAR[star])}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 w-16 shrink-0 justify-end">
                      <span className="text-sm font-medium text-foreground">{count}</span>
                      <span className="text-xs text-muted-foreground">({pct}%)</span>
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="p-6">
            {isLoading && reviews.length === 0 ? (
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="h-14 w-20" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-36" />
                <div className="w-full border-t pt-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-5xl font-bold text-foreground">{avgRating}</p>
                <div className="flex justify-center">
                  <Stars rating={Math.round(Number(avgRating))} size="h-5 w-5" />
                </div>
                <p className="text-sm text-muted-foreground">
                  out of 5 · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </p>
                <div className="border-t pt-3 mt-1 space-y-2 text-left">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Would recommend</span>
                    <span className="font-semibold text-green-600">{recommendPct}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">5-star reviews</span>
                    <span className="font-semibold text-foreground">{fiveStarPct}%</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Branch selector (superadmin) ─────────────────────────────────────── */}
      {user && role !== "admin" && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {[{ _id: "all", name: "All Branches" }, ...hotels].map((h) => (
            <button
              key={h._id}
              onClick={() => setHotelFilter(h._id, role)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                selectedHotelId === h._id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              )}
            >
              {h.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Branch label (admin) ─────────────────────────────────────────────── */}
      {role === "admin" && (
        <div className="flex items-center gap-2 text-sm px-3 py-2 bg-muted/60 rounded-lg w-fit">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>
            Showing reviews for <strong>{userHotelName}</strong>
          </span>
        </div>
      )}

      {/* ── Search + Filters ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by guest name or review text…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Rating
              </Label>
              <Select
                value={ratingFilter !== null ? String(ratingFilter) : "all"}
                onValueChange={(v) =>
                  setRatingFilter(v === "all" ? null : Number(v), role)
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ratings</SelectItem>
                  <SelectItem value="5">★★★★★  5 stars</SelectItem>
                  <SelectItem value="4">★★★★☆  4 stars</SelectItem>
                  <SelectItem value="3">★★★☆☆  3 stars</SelectItem>
                  <SelectItem value="2">★★☆☆☆  2 stars</SelectItem>
                  <SelectItem value="1">★☆☆☆☆  1 star</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                From
              </Label>
              <Input
                type="date"
                className="w-40"
                value={startDate}
                onChange={(e) => setDateRange(e.target.value, endDate, role)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                To
              </Label>
              <Input
                type="date"
                className="w-40"
                value={endDate}
                onChange={(e) => setDateRange(startDate, e.target.value, role)}
              />
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1 mb-0.5"
              >
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-5 flex items-center gap-4">
            <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">Error loading reviews</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              onClick={() => fetchReviews(role)}
              variant="outline"
              size="sm"
              className="ml-auto shrink-0"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────────── */}
      {isLoading && reviews.length === 0 && (
        <div className="grid grid-cols-1 gap-3">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────────── */}
      {!isLoading && !error && displayedReviews.length === 0 && (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Star className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">No Reviews Found</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {hasActiveFilters
                  ? "No reviews match your current filters."
                  : "No guest reviews have been submitted yet."}
              </p>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Review cards ─────────────────────────────────────────────────────── */}
      {!isLoading && !error && displayedReviews.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {displayedReviews.map((review, index) => {
            const initials = getInitials(review.guestName);
            const color    = avatarColor(review.guestName);
            const border   = RATING_BORDER[review.rating] ?? "border-l-gray-300";

            return (
              <Card
                key={review._id}
                className={cn(
                  "border-l-4 hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-1",
                  border
                )}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                        color
                      )}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground leading-tight truncate">
                            {review.guestName}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {review.hotelId?.name || "Unknown Branch"}
                            </span>
                            {review.bookingId?.confirmationCode && (
                              <Badge
                                variant="secondary"
                                className="text-xs px-1.5 py-0 font-normal"
                              >
                                #{review.bookingId.confirmationCode}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Stars rating={review.rating} />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.createdAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  {review.title && (
                    <p className="font-medium text-foreground">{review.title}</p>
                  )}

                  {/* Comment */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Sub-ratings + recommend */}
                  {(review.serviceRating ||
                    review.cleanlinessRating ||
                    review.wouldRecommend !== null) && (
                    <>
                      <div className="border-t" />
                      <div className="flex flex-wrap items-center gap-3">
                        {review.serviceRating ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>Service</span>
                            <Stars rating={review.serviceRating} size="h-3 w-3" />
                          </div>
                        ) : null}
                        {review.cleanlinessRating ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>Cleanliness</span>
                            <Stars rating={review.cleanlinessRating} size="h-3 w-3" />
                          </div>
                        ) : null}
                        {review.wouldRecommend === true && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            <ThumbsUp className="h-3 w-3" /> Recommends
                          </span>
                        )}
                        {review.wouldRecommend === false && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                            <ThumbsDown className="h-3 w-3" /> Does not recommend
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
