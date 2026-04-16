import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useGetCart, usePlaceOrder, getGetCartQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSessionId } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ChevronLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(10, "Full address is required"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().min(6, "Valid PIN code required"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function Checkout() {
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cart, isLoading: isCartLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId } }
  );

  const placeOrderMutation = usePlaceOrder();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      address: "",
      city: "",
      pincode: "",
    },
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (!isCartLoading && (!cart || cart.items.length === 0)) {
      toast({
        title: "Cart is empty",
        description: "Please add some items to your cart before checkout.",
        variant: "destructive"
      });
      setLocation("/shop");
    }
  }, [cart, isCartLoading, setLocation, toast]);

  const onSubmit = (data: CheckoutFormValues) => {
    placeOrderMutation.mutate(
      {
        data: {
          sessionId,
          ...data,
        },
      },
      {
        onSuccess: (order) => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
          
          // Generate a new session ID for future shopping
          localStorage.setItem("somya_session_id", crypto.randomUUID());
          
          setLocation(`/checkout/payment?orderId=${order.id}`);
        },
        onError: () => {
          toast({
            title: "Checkout Failed",
            description: "There was a problem placing your order. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const shipping = (cart?.total || 0) > 999 ? 0 : 99;
  const total = (cart?.total || 0) + shipping;

  if (isCartLoading || !cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-24 md:pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <Link href="/cart" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Cart
          </Link>
          
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-8">
            Checkout
          </h1>

          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            {/* Checkout Form */}
            <div className="lg:w-1/2">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                <h2 className="font-serif text-xl font-bold">Contact & Shipping Details</h2>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 98765 43210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="jane@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="House/Flat No., Street Name, Area" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Mumbai" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PIN Code</FormLabel>
                          <FormControl>
                            <Input placeholder="400001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-8 pb-4 border-b border-border">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                    <h2 className="font-serif text-xl font-bold">Payment</h2>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg flex items-start gap-4 border border-border">
                    <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium mb-1">Secure Cash on Delivery</h4>
                      <p className="text-sm text-muted-foreground">
                        Pay with cash or UPI when your order is delivered to your doorstep.
                      </p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-base uppercase tracking-wider mt-8"
                    disabled={placeOrderMutation.isPending}
                  >
                    {placeOrderMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                      </>
                    ) : (
                      `Place Order • ₹${total.toFixed(2)}`
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Order Summary */}
            <div className="lg:w-1/2">
              <div className="bg-muted/30 border border-border rounded-lg p-6 lg:sticky lg:top-32">
                <h2 className="font-serif text-xl font-bold mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 aspect-[4/5] bg-muted rounded overflow-hidden shrink-0 relative">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full z-10 border border-background">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{item.product.category}</p>
                      </div>
                      <div className="pt-1 text-right">
                        <span className="font-medium text-sm">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 text-sm pt-4 border-t border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{cart.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-2xl">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
