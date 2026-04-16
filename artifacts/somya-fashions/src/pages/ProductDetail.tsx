import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useGetProduct, useListProducts, useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { getSessionId } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Minus, Plus, ChevronRight, ChevronLeft, ShieldCheck, RotateCcw, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id ? parseInt(params.id, 10) : 0;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId }
  });

  const { data: relatedProducts } = useListProducts(
    { category: product?.category },
    { query: { enabled: !!product?.category } }
  );

  const addToCartMutation = useAddToCart();

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCartMutation.mutate(
      {
        data: {
          sessionId: getSessionId(),
          productId: product.id,
          quantity,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId: getSessionId() }) });
          toast({
            title: "Added to Cart",
            description: `${quantity}x ${product.name} added to your cart.`,
          });
        },
      }
    );
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    addToCartMutation.mutate(
      {
        data: {
          sessionId: getSessionId(),
          productId: product.id,
          quantity,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId: getSessionId() }) });
          setLocation("/checkout");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 container mx-auto px-4">
          <div className="animate-pulse flex flex-col md:flex-row gap-12">
            <div className="w-full md:w-1/2 aspect-[4/5] bg-muted rounded-lg"></div>
            <div className="w-full md:w-1/2 space-y-6 pt-8">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded w-3/4"></div>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-24 bg-muted rounded w-full"></div>
              <div className="h-12 bg-muted rounded w-full mt-8"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 container mx-auto px-4 text-center">
          <h1 className="text-3xl font-serif mb-4">Product not found</h1>
          <Link href="/shop">
            <Button>Return to Shop</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-24 md:pt-32 pb-16">
        <div className="container mx-auto px-4">
          
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link href="/shop" className="hover:text-primary">Shop</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link href={`/shop?category=${product.category}`} className="hover:text-primary">{product.category}</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-foreground truncate max-w-[200px] sm:max-w-none">{product.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 mb-24">
            {/* Image Gallery */}
            <div className="lg:w-1/2 flex flex-col md:flex-row-reverse gap-4">
              <div className="w-full md:w-4/5 aspect-[4/5] relative bg-muted rounded-lg overflow-hidden border border-border">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    src={allImages[activeImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 uppercase tracking-wider rounded-sm z-10">
                    Sale
                  </span>
                )}
              </div>
              
              {allImages.length > 1 && (
                <div className="flex md:flex-col gap-4 overflow-x-auto md:w-1/5 md:overflow-y-auto no-scrollbar pb-2 md:pb-0">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={cn(
                        "flex-shrink-0 w-20 md:w-full aspect-[4/5] rounded-md overflow-hidden border-2 transition-all",
                        activeImage === idx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="lg:w-1/2">
              <div className="mb-8 border-b border-border pb-8">
                <div className="text-sm text-primary uppercase tracking-widest mb-3 font-semibold">
                  {product.category}
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4 leading-tight">
                  {product.name}
                </h1>
                
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-2xl font-medium">₹{product.price.toFixed(2)}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">₹{product.originalPrice.toFixed(2)}</span>
                      <span className="text-sm font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">
                        Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>

                <div className="prose prose-sm md:prose-base text-muted-foreground">
                  <p className="leading-relaxed">{product.description}</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-medium">Quantity:</span>
                  <div className="flex items-center border border-border rounded-md">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className={cn(
                    "text-sm font-medium ml-4",
                    product.inStock ? "text-green-600 dark:text-green-400" : "text-destructive"
                  )}>
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={handleAddToCart}
                    variant="outline"
                    size="lg"
                    className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground h-14 text-base uppercase tracking-wider"
                    disabled={!product.inStock || addToCartMutation.isPending}
                  >
                    {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                  </Button>
                  <Button 
                    onClick={handleBuyNow}
                    size="lg"
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-base uppercase tracking-wider"
                    disabled={!product.inStock || addToCartMutation.isPending}
                  >
                    Buy It Now
                  </Button>
                </div>
              </div>

              {/* Product Details & Trust Signals */}
              <div className="space-y-6 pt-6 border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Material</span>
                    <span className="font-medium text-foreground">{product.material}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">SKU</span>
                    <span className="font-medium text-foreground uppercase">SMY-{product.id.toString().padStart(4, '0')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-center">
                  <div className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <Truck className="w-6 h-6 text-primary" />
                    <span className="text-xs font-medium">Free Shipping</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <RotateCcw className="w-6 h-6 text-primary" />
                    <span className="text-xs font-medium">7-Day Returns</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                    <span className="text-xs font-medium">1 Year Warranty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 1 && (
            <section className="py-16 border-t border-border">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-serif font-bold text-foreground mb-4">You May Also Like</h2>
                <div className="w-12 h-1 bg-primary mx-auto"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts
                  .filter(p => p.id !== product.id)
                  .slice(0, 4)
                  .map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
