import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, User, Calendar } from 'lucide-react';
import {
  useReviewState,
  useReviewActions,
} from '@/store/useReviewStore'; // Adjust path as needed
import { ReviewSkeleton } from '@/components/skeleton/ReviewSkeleton'; // Adjust path
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';

export default function Reviews() {
  // --- Get State & Actions from Zustand Store ---
  const { reviews, hotels, selectedHotelId, isLoading, error } = useReviewState();
  const { fetchHotels, fetchReviews, setHotelFilter } = useReviewActions();

  // --- Fetch Data on Component Mount ---
  useEffect(() => {
    fetchHotels();
    fetchReviews();
  }, [fetchHotels, fetchReviews]); // Use store actions in dependency array

  // --- Helper Function ---
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'fill-secondary text-secondary' : 'text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  // --- Dynamic Calculation ---
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, review) => acc + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : 'N/A';

  // --- Render Content ---
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
            <Button variant="destructive" onClick={fetchReviews}>
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
            No reviews found for this branch.
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
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {review.guestName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {review.hotelId?.name || 'Unknown Branch'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {renderStars(review.rating)}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-foreground leading-relaxed">
                    {review.comment}
                  </p>
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guest Reviews</h1>
          <p className="text-muted-foreground">
            Feedback and ratings from guests
          </p>
        </div>
        <Card className="lg:w-64">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">
                {averageRating}
              </p>
              <div className="flex justify-center my-2">
                {renderStars(Math.round(Number(averageRating)))}
              </div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Branch Filter Toggle --- */}
      <div className="flex justify-center">
        <ToggleGroup
          type="single"
          value={selectedHotelId}
          onValueChange={(value) => {
            if (value) setHotelFilter(value);
          }}
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

      {/* --- Dynamic Content --- */}
      {renderContent()}
    </div>
  );
}