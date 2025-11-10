import { Card, CardContent } from "@/components/ui/card";
import { Star, User, Calendar } from "lucide-react";

const reviews = [
  { id: 1, guest: "Alice Cooper", rating: 5, comment: "Excellent service! The staff was incredibly friendly and helpful. The room was spotless and the amenities exceeded our expectations.", date: "2024-05-10", branch: "Downtown Branch" },
  { id: 2, guest: "Bob Martin", rating: 4, comment: "Great location and comfortable rooms. The breakfast buffet could be improved, but overall a pleasant stay.", date: "2024-05-09", branch: "Airport Branch" },
  { id: 3, guest: "Carol White", rating: 5, comment: "Perfect beachfront location! Stunning views and exceptional hospitality. Will definitely return.", date: "2024-05-08", branch: "Beach Branch" },
  { id: 4, guest: "Dan Lee", rating: 3, comment: "Decent hotel but had some noise issues. The room was clean but a bit dated. Staff was responsive to concerns.", date: "2024-05-07", branch: "City Center" },
  { id: 5, guest: "Emma Clark", rating: 5, comment: "Outstanding experience from check-in to check-out. The concierge service was top-notch and helped plan our entire trip.", date: "2024-05-06", branch: "Downtown Branch" },
];

export default function Reviews() {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "fill-secondary text-secondary" : "text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  const averageRating = (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guest Reviews</h1>
          <p className="text-muted-foreground">Feedback and ratings from guests</p>
        </div>
        <Card className="lg:w-64">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{averageRating}</p>
              <div className="flex justify-center my-2">
                {renderStars(Math.round(Number(averageRating)))}
              </div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reviews.map((review, index) => (
          <Card key={review.id} className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-left" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{review.guest}</h3>
                      <p className="text-sm text-muted-foreground">{review.branch}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {renderStars(review.rating)}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-foreground leading-relaxed">{review.comment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
