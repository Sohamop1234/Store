import { Link } from "wouter";
import { useAddToCart } from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCartQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const addToCartMutation = useAddToCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCartMutation.mutate(
      {
        data: {
          sessionId: getSessionId(),
          productId: product.id,
          quantity: 1,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId: getSessionId() }) });
          toast({
            title: "Added to Cart",
            description: `${product.name} has been added to your cart.`,
          });
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative flex flex-col h-full bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all duration-300"
    >
      <Link href={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-muted">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/20">
            No image
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
              Sale
            </span>
          )}
          {product.featured && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
              Featured
            </span>
          )}
        </div>

        {/* Quick Add Button */}
        <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <Button 
            onClick={handleAddToCart}
            className="w-full bg-background/90 text-foreground hover:bg-primary hover:text-primary-foreground backdrop-blur-sm"
            disabled={!product.inStock || addToCartMutation.isPending}
          >
            {addToCartMutation.isPending ? "Adding..." : (
              <>
                <ShoppingBag className="w-4 h-4 mr-2" /> Add to Cart
              </>
            )}
          </Button>
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
          {product.category}
        </div>
        <Link href={`/product/${product.id}`} className="block mb-2">
          <h3 className="font-serif text-lg font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto pt-2 flex items-center gap-2">
          <span className="text-foreground font-medium">
            ₹{product.price.toFixed(2)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-muted-foreground text-sm line-through">
              ₹{product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
