import { Link, useLocation } from "wouter";
import { useGetCart, useUpdateCartItem, useRemoveFromCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getSessionId } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, X, ArrowRight, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Cart() {
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId } }
  );

  const updateCartItemMutation = useUpdateCartItem();
  const removeFromCartMutation = useRemoveFromCart();

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    updateCartItemMutation.mutate(
      {
        itemId,
        data: {
          sessionId,
          quantity: newQuantity,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
        },
      }
    );
  };

  const handleRemoveItem = (itemId: number) => {
    removeFromCartMutation.mutate(
      {
        itemId,
        data: { sessionId },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
        },
      }
    );
  };

  const isCartEmpty = !cart?.items || cart.items.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-8 text-center md:text-left">
            Your Cart
          </h1>

          {isLoading ? (
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="lg:w-2/3 space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4 border border-border p-4 rounded-lg">
                    <div className="w-24 h-32 bg-muted rounded"></div>
                    <div className="flex-1 space-y-4 py-2">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-8 bg-muted rounded w-32 mt-4"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="lg:w-1/3">
                <div className="animate-pulse border border-border p-6 rounded-lg space-y-4">
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-px bg-border my-4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-px bg-border my-4"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                  <div className="h-12 bg-muted rounded w-full mt-6"></div>
                </div>
              </div>
            </div>
          ) : isCartEmpty ? (
            <div className="text-center py-24 bg-muted/20 rounded-lg border border-border">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-6">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-serif font-bold mb-4">Your cart is empty</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Looks like you haven't added anything to your cart yet. 
                Explore our collections to find something beautiful.
              </p>
              <Link href="/shop">
                <Button size="lg" className="bg-primary text-primary-foreground">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Cart Items */}
              <div className="lg:w-2/3">
                <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-4">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                <div className="space-y-6">
                  <AnimatePresence>
                    {cart?.items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col md:grid md:grid-cols-12 gap-4 items-center border border-border md:border-none p-4 md:p-0 rounded-lg md:rounded-none"
                      >
                        <div className="col-span-6 flex items-center gap-6 w-full">
                          <Link href={`/product/${item.productId}`} className="shrink-0">
                            <div className="w-24 aspect-[4/5] bg-muted rounded overflow-hidden">
                              <img 
                                src={item.product.imageUrl} 
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </Link>
                          <div className="flex flex-col">
                            <Link href={`/product/${item.productId}`}>
                              <h3 className="font-serif text-lg font-medium hover:text-primary transition-colors line-clamp-2">
                                {item.product.name}
                              </h3>
                            </Link>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.product.category}
                            </p>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-sm text-destructive hover:underline flex items-center gap-1 mt-3 w-fit"
                              disabled={removeFromCartMutation.isPending}
                            >
                              <X className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center justify-between md:justify-center w-full md:w-auto border-t border-border pt-4 md:pt-0 md:border-none">
                          <span className="md:hidden text-sm text-muted-foreground">Quantity</span>
                          <div className="flex items-center border border-border rounded-md">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="p-1.5 hover:bg-muted text-muted-foreground disabled:opacity-50"
                              disabled={item.quantity <= 1 || updateCartItemMutation.isPending}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {updateCartItemMutation.variables?.itemId === item.id ? "..." : item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 hover:bg-muted text-muted-foreground disabled:opacity-50"
                              disabled={item.quantity >= 10 || updateCartItemMutation.isPending}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center justify-between md:justify-end w-full md:w-auto">
                          <span className="md:hidden text-sm text-muted-foreground">Price</span>
                          <span className="font-medium">₹{item.product.price.toFixed(2)}</span>
                        </div>

                        <div className="col-span-2 flex items-center justify-between md:justify-end w-full md:w-auto font-medium text-lg">
                          <span className="md:hidden text-sm text-muted-foreground font-normal">Total</span>
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:w-1/3">
                <div className="bg-muted/30 border border-border rounded-lg p-6 lg:sticky lg:top-32">
                  <h2 className="font-serif text-xl font-bold mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 text-sm mb-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({cart?.itemCount} items)</span>
                      <span className="font-medium">₹{cart?.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {(cart?.total || 0) > 999 ? "Free" : "₹99.00"}
                      </span>
                    </div>
                    {cart?.total && cart.total <= 999 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Add ₹{(999 - cart.total).toFixed(2)} more for free shipping
                      </p>
                    )}
                  </div>

                  <div className="border-t border-border pt-4 mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-2xl">
                        ₹{((cart?.total || 0) + ((cart?.total || 0) > 999 ? 0 : 99)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      Including all taxes
                    </p>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-base uppercase tracking-wider group"
                    onClick={() => setLocation("/checkout")}
                  >
                    Proceed to Checkout 
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <div className="mt-6 flex flex-col gap-2 text-center text-xs text-muted-foreground">
                    <p>Secure Checkout</p>
                    <div className="flex justify-center gap-2">
                      <span className="px-2 py-1 bg-background border border-border rounded">VISA</span>
                      <span className="px-2 py-1 bg-background border border-border rounded">MasterCard</span>
                      <span className="px-2 py-1 bg-background border border-border rounded">UPI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
