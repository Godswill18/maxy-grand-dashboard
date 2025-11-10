import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Users, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Table {
  number: number;
  status: "Available" | "Occupied" | "Needs Cleaning";
  guest?: string;
  seats: number;
  reservationTime?: string;
}

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([
    { number: 1, status: "Occupied", guest: "John Doe", seats: 4, reservationTime: "12:00 PM" },
    { number: 2, status: "Available", seats: 2 },
    { number: 3, status: "Occupied", guest: "Sarah Smith", seats: 6, reservationTime: "12:30 PM" },
    { number: 4, status: "Needs Cleaning", seats: 4 },
    { number: 5, status: "Occupied", guest: "Mike Johnson", seats: 2, reservationTime: "1:00 PM" },
    { number: 6, status: "Available", seats: 8 },
    { number: 7, status: "Occupied", guest: "Emma Wilson", seats: 4, reservationTime: "1:15 PM" },
    { number: 8, status: "Needs Cleaning", seats: 6 },
  ]);

  const markAsCleaned = (tableNumber: number) => {
    setTables(tables.map(table =>
      table.number === tableNumber ? { ...table, status: "Available" as const } : table
    ));
    toast.success(`Table ${tableNumber} marked as cleaned`);
  };

  const requestCleaning = (tableNumber: number) => {
    setTables(tables.map(table =>
      table.number === tableNumber ? { ...table, status: "Needs Cleaning" as const } : table
    ));
    toast.info(`Cleaning requested for Table ${tableNumber}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-success/10 text-success hover:bg-success/20";
      case "Occupied": return "bg-info/10 text-info hover:bg-info/20";
      case "Needs Cleaning": return "bg-warning/10 text-warning hover:bg-warning/20";
      default: return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Available": return <UtensilsCrossed className="h-12 w-12 text-success" />;
      case "Occupied": return <Users className="h-12 w-12 text-info" />;
      case "Needs Cleaning": return <Sparkles className="h-12 w-12 text-warning" />;
      default: return <UtensilsCrossed className="h-12 w-12" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Tables</p>
            <p className="text-3xl font-bold">{tables.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-3xl font-bold text-success">
              {tables.filter(t => t.status === "Available").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Occupied</p>
            <p className="text-3xl font-bold text-info">
              {tables.filter(t => t.status === "Occupied").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Needs Cleaning</p>
            <p className="text-3xl font-bold text-warning">
              {tables.filter(t => t.status === "Needs Cleaning").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => (
          <Card key={table.number} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Table {table.number}</CardTitle>
                <Badge className={getStatusColor(table.status)}>
                  {table.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center p-4">
                {getStatusIcon(table.status)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Seats:</span>
                  <span className="font-medium">{table.seats}</span>
                </div>
                {table.guest && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Guest:</span>
                    <span className="font-medium">{table.guest}</span>
                  </div>
                )}
                {table.reservationTime && (
                  <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{table.reservationTime}</span>
                  </div>
                )}
              </div>

              {table.status === "Needs Cleaning" && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => markAsCleaned(table.number)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Mark as Cleaned
                </Button>
              )}
              {table.status === "Occupied" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => requestCleaning(table.number)}
                >
                  Request Cleaning
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
