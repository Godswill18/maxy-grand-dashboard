import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, User, Calendar, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import {
  useReviewState,
  useReviewActions,
} from '@/store/useReviewStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ReviewSkeleton } from '@/components/skeleton/ReviewSkeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Star renderer ──────────────────────────────────────────────────────────────

const Stars = ({ rating, size = 'h-4 w-4' }: { rating: number; size?: string }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
      />
    ))}
  </div>
);

// ── Sub-rating row ─────────────────────────────────────────────────────────────

const SubRating = ({ label, value }: { label: string; value: number | null | undefined }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <Stars rating={value} size="h-3.5 w-3.5" />
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function Reviews() {
  const {
    reviews, hotels, selectedHotelId,
    ratingFilter, startDate, endDate,
    isLoading, error,
  } = useReviewState();

  const { fetchHotels, fetchReviews, setHotelFilter, setRatingFilter, setDateRange } = useReviewActions();

  const user = useAuthStore((state) => state.user);
  const role  = user?.role;

  // Fetch hotels list once (for superadmin branch toggle)
  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  // Initial load — role-aware
  useEffect(() => {
    if (user) {
      fetchReviews(role);
    }
  }, [user]);  // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters = ratingFilter !== null || startDate !== '' || endDate !== '';

  const clearFilters = () => {
    setDateRange('', '', role);
    setRatingFilter(null, role);
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : 'N/A';

  const userHotelName =
    role === 'admin'
      ? hotels.find((h) => h._id === user?.hotelId)?.name || 'Your Branch'
      : null;

  // ── Content area ──

  const renderContent = () => {
    if (isLoading && reviews.length === 0) {
      return (
        <div className="grid grid-cols-1 gap-4">
          <ReviewSkeleton />
          <ReviewSkeleton />
          <ReviewSkeleton />
        </div>
      );
    }

    if (error) {
      return (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="destructive" onClick={() => fetchReviews(role)}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (reviews.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No reviews found{hasActiveFilters ? ' for the current filters' : ' yet'}.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {reviews.map((review, index) => (
          <Card
            key={review._id}
            className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-left"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1 space-y-3 min-w-0">
                  {/* Header row */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground leading-tight">
                        {review.guestName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {review.hotelId?.name || 'Unknown Branch'}
                        {review.bookingId?.confirmationCode && (
                          <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                            #{review.bookingId.confirmationCode}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Stars rating={review.rating} />
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  {review.title && (
                    <p className="font-medium text-foreground">{review.title}</p>
                  )}

                  {/* Comment */}
                  <p className="text-foreground leading-relaxed">{review.comment}</p>

                  {/* Sub-ratings + recommendation */}
                  {(review.serviceRating || review.cleanlinessRating || review.wouldRecommend !== null) && (
                    <div className="pt-2 border-t space-y-2">
                      <SubRating label="Service"     value={review.serviceRating} />
                      <SubRating label="Cleanliness" value={review.cleanlinessRating} />
                      {review.wouldRecommend !== null && review.wouldRecommend !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          {review.wouldRecommend ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              <ThumbsUp className="h-3 w-3" /> Recommends
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                              <ThumbsDown className="h-3 w-3" /> Does not recommend
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page header + average rating card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guest Reviews</h1>
          <p className="text-muted-foreground">Feedback and ratings from guests</p>
        </div>
        <Card className="lg:w-56">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{averageRating}</p>
              <div className="flex justify-center my-2">
                <Stars rating={Math.round(Number(averageRating))} />
              </div>
              <p className="text-sm text-muted-foreground">
                Average · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch filter (superadmin only) */}
      {user && role !== 'admin' && (
        <div className="flex justify-center">
          <ToggleGroup
            type="single"
            value={selectedHotelId}
            onValueChange={(value) => { if (value) setHotelFilter(value, role); }}
            className="flex-wrap justify-center"
          >
            <ToggleGroupItem value="all">All Branches</ToggleGroupItem>
            {hotels.map((hotel) => (
              <ToggleGroupItem value={hotel._id} key={hotel._id}>
                {hotel.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {/* Branch label (manager) */}
      {role === 'admin' && (
        <div className="flex justify-center">
          <p className="text-muted-foreground px-4 py-2 bg-muted rounded-md text-sm">
            Showing reviews for <strong>{userHotelName}</strong>
          </p>
        </div>
      )}

      {/* Filters row */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Rating filter */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Rating</Label>
              <Select
                value={ratingFilter !== null ? String(ratingFilter) : 'all'}
                onValueChange={(v) => setRatingFilter(v === 'all' ? null : Number(v), role)}
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

            {/* Date from */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">From</Label>
              <Input
                type="date"
                className="w-40"
                value={startDate}
                onChange={(e) => setDateRange(e.target.value, endDate, role)}
              />
            </div>

            {/* Date to */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">To</Label>
              <Input
                type="date"
                className="w-40"
                value={endDate}
                onChange={(e) => setDateRange(startDate, e.target.value, role)}
              />
            </div>

            {/* Clear */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1 mb-0.5">
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review list */}
      {renderContent()}
    </div>
  );
}
