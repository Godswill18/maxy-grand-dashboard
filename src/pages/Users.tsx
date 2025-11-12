import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar } from "lucide-react";
import { useStaffStore } from "../store/useUserStore";

export default function Users() {
  const guests = useStaffStore((state) => state.guests);
  const isLoading = useStaffStore((state) => state.isLoading);
  const error = useStaffStore((state) => state.error);
  const fetchGuests = useStaffStore((state: any) => state.fetchGuests);

  useEffect(() => {
    if (!guests.length) fetchGuests();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guest Management</h1>
          <p className="text-muted-foreground">View and manage registered guests</p>
        </div>
      </div>

      {/* --- LOADING SKELETON --- */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="border-muted animate-pulse bg-muted/40"
            >
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="h-5 w-3/4 bg-muted rounded-md" />
                  <div className="h-4 w-1/3 bg-muted rounded-md" />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted rounded-full" />
                    <div className="h-3 w-2/3 bg-muted rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted rounded-full" />
                    <div className="h-3 w-1/2 bg-muted rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted rounded-full" />
                    <div className="h-3 w-1/3 bg-muted rounded-md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* --- ERROR STATE --- */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <p className="text-destructive">Error: {error}</p>
        </div>
      )}

      {/* --- EMPTY STATE --- */}
      {!isLoading && !error && guests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No guests found.</p>
        </div>
      )}

      {/* --- DATA DISPLAY --- */}
      {!isLoading && !error && (guests || []).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(guests || []).map((user, index) => (
            <Card
              key={user._id}
              className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">
                      {user.firstName} {user.lastName}
                    </h3>
                    <Badge
                      variant={user.isActive ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{user.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
