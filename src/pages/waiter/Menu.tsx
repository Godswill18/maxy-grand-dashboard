import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: "breakfast" | "lunch" | "dinner" | "drinks";
  image?: string;
}

export default function Menu() {
  const [cart, setCart] = useState<MenuItem[]>([]);

  const menuItems: MenuItem[] = [
    { id: "1", name: "Grilled Chicken", price: "₦4,500", category: "lunch" },
    { id: "2", name: "Pasta Alfredo", price: "₦3,800", category: "lunch" },
    { id: "3", name: "Beef Burger", price: "₦3,200", category: "lunch" },
    { id: "4", name: "Sushi Platter", price: "₦12,000", category: "dinner" },
    { id: "5", name: "Grilled Salmon", price: "₦8,500", category: "dinner" },
    { id: "6", name: "Lobster Thermidor", price: "₦15,000", category: "dinner" },
    { id: "7", name: "Pancakes", price: "₦2,500", category: "breakfast" },
    { id: "8", name: "Eggs Benedict", price: "₦3,000", category: "breakfast" },
    { id: "9", name: "French Toast", price: "₦2,200", category: "breakfast" },
    { id: "10", name: "Mojito", price: "₦1,500", category: "drinks" },
    { id: "11", name: "Lemonade", price: "₦800", category: "drinks" },
    { id: "12", name: "Fresh Juice", price: "₦1,200", category: "drinks" },
  ];

  const addToCart = (item: MenuItem) => {
    setCart([...cart, item]);
    toast.success(`${item.name} added to order`);
  };

  const clearCart = () => {
    setCart([]);
    toast.info("Cart cleared");
  };

  const placeOrder = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    toast.success(`Order placed with ${cart.length} items`);
    setCart([]);
  };

  const total = cart.reduce((sum, item) => {
    const price = parseInt(item.price.replace(/[₦,]/g, ""));
    return sum + price;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Restaurant Menu</h2>
          <p className="text-muted-foreground">Select items to create a new order</p>
        </div>
        {cart.length > 0 && (
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {cart.length} items
            </Badge>
            <Button onClick={placeOrder}>Place Order</Button>
            <Button variant="outline" onClick={clearCart}>Clear</Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="lunch" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
          <TabsTrigger value="lunch">Lunch</TabsTrigger>
          <TabsTrigger value="dinner">Dinner</TabsTrigger>
          <TabsTrigger value="drinks">Drinks</TabsTrigger>
        </TabsList>

        {["breakfast", "lunch", "dinner", "drinks"].map((category) => (
          <TabsContent key={category} value={category}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {menuItems
                .filter((item) => item.category === category)
                .map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4 flex items-center justify-center">
                        <span className="text-4xl">🍽️</span>
                      </div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">{item.price}</span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => addToCart(item)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Order
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border-b border-border">
                  <span>{item.name}</span>
                  <span className="font-semibold">{item.price}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4 text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">₦{total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
