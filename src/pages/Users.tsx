import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar } from "lucide-react";

const users = [
  { id: 1, name: "Alice Cooper", email: "alice.c@email.com", phone: "+1 555 111 2222", registered: "2024-01-15", bookings: 5, status: "Active" },
  { id: 2, name: "Bob Martin", email: "bob.m@email.com", phone: "+1 555 222 3333", registered: "2024-02-20", bookings: 3, status: "Active" },
  { id: 3, name: "Carol White", email: "carol.w@email.com", phone: "+1 555 333 4444", registered: "2024-03-10", bookings: 8, status: "VIP" },
  { id: 4, name: "Dan Lee", email: "dan.l@email.com", phone: "+1 555 444 5555", registered: "2024-01-05", bookings: 12, status: "VIP" },
  { id: 5, name: "Emma Clark", email: "emma.c@email.com", phone: "+1 555 555 6666", registered: "2024-04-01", bookings: 2, status: "Active" },
  { id: 6, name: "Frank Miller", email: "frank.m@email.com", phone: "+1 555 666 7777", registered: "2024-02-15", bookings: 6, status: "Active" },
];

export default function Users() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guest Management</h1>
          <p className="text-muted-foreground">View and manage registered guests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user, index) => (
          <Card key={user.id} className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{user.name}</h3>
                  <Badge variant={user.status === "VIP" ? "default" : "secondary"} className="mt-1">
                    {user.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{user.bookings}</p>
                  <p className="text-xs text-muted-foreground">bookings</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {user.registered}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
