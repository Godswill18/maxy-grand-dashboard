import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, User, Calendar, DollarSign } from "lucide-react";

const transactions = [
  { id: 1, guest: "Alice Cooper", amount: 450, method: "Credit Card", date: "2024-05-14", status: "Paid", type: "Online" },
  { id: 2, guest: "Bob Martin", amount: 600, method: "Cash", date: "2024-05-14", status: "Paid", type: "Offline" },
  { id: 3, guest: "Carol White", amount: 1250, method: "Credit Card", date: "2024-05-13", status: "Paid", type: "Online" },
  { id: 4, guest: "Dan Lee", amount: 3500, method: "Bank Transfer", date: "2024-05-13", status: "Pending", type: "Online" },
  { id: 5, guest: "Emma Clark", amount: 200, method: "Credit Card", date: "2024-05-12", status: "Paid", type: "Online" },
  { id: 6, guest: "Frank Miller", amount: 900, method: "Cash", date: "2024-05-12", status: "Paid", type: "Offline" },
];

export default function Transactions() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
        <p className="text-muted-foreground">View all payment transactions</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {transactions.map((transaction, index) => (
          <Card key={transaction.id} className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-left" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <DollarSign className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{transaction.guest}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>{transaction.method}</span>
                      <Badge variant="outline" className="ml-2">{transaction.type}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{transaction.date}</span>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">${transaction.amount}</p>
                  </div>

                  <Badge className={transaction.status === "Paid" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
