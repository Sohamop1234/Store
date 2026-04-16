import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useGetFeaturedProducts, useGetCategories } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Truck, ShieldCheck, HeartHandshake, ArrowRight } from "lucide-react";

export function Home() {
  const { data: featuredProducts, isLoading: productsLoading } = useGetFeaturedProducts();
  const { data: categories } = useGetCategories();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/hero.png" 
              alt="Somya Fashions Luxury Jewellery" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          
          <div className="container relative z-10 mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <h2 className="text-primary-foreground/80 tracking-[0.3em] uppercase text-sm font-semibold">
                New Collection Arrival
              </h2>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white drop-shadow-lg">
                Affordable <span className="italic text-primary-foreground">Luxury</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto font-light leading-relaxed">
                Discover our curated collection of exquisite artificial jewellery designed to elevate your everyday elegance.
              </p>
              <div className="pt-8">
                <Link href="/shop">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 rounded-none uppercase tracking-widest">
                    Shop The Collection
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-12 bg-muted border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="flex flex-col items-center justify-center p-4">
                <Truck className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-serif text-lg font-semibold mb-2">Free Shipping</h3>
                <p className="text-muted-foreground text-sm">On all orders over ₹999</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <ShieldCheck className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-serif text-lg font-semibold mb-2">Premium Quality</h3>
                <p className="text-muted-foreground text-sm">1 Year Polish Guarantee</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <HeartHandshake className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-serif text-lg font-semibold mb-2">Easy Returns</h3>
                <p className="text-muted-foreground text-sm">7 Day Return Policy</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">Shop by Category</h2>
              <div className="w-16 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {['Necklaces', 'Earrings', 'Bangles', 'Rings'].map((cat, index) => (
                <Link key={cat} href={`/shop?category=${cat}`} className="group relative aspect-[3/4] overflow-hidden rounded-lg block">
                  <img 
                    src={`/images/category-${cat.toLowerCase()}.png`} 
                    alt={cat} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1599643478514-4a820c56a8e0?auto=format&fit=crop&q=80&w=800'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 w-full p-6 flex justify-between items-end">
                    <h3 className="text-white font-serif text-2xl font-semibold">{cat}</h3>
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-primary transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">Trending Now</h2>
                <div className="w-16 h-1 bg-primary"></div>
              </div>
              <Link href="/shop" className="hidden md:flex items-center text-primary font-medium hover:text-primary/80 uppercase tracking-wider text-sm transition-colors">
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-card border border-border rounded-lg overflow-hidden">
                    <div className="aspect-[4/5] bg-muted"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/4 pt-2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts?.slice(0, 8).map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
            
            <div className="mt-12 text-center md:hidden">
              <Link href="/shop">
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  View All Products
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Brand Story */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2 relative">
                <div className="aspect-square rounded-full overflow-hidden border-8 border-muted">
                  <img 
                    src="/images/hero.png" 
                    alt="Craftsmanship" 
                    className="w-full h-full object-cover grayscale-[30%]"
                  />
                </div>
                <div className="absolute -bottom-8 -right-8 w-48 h-48 rounded-full overflow-hidden border-8 border-background hidden md:block">
                  <img 
                    src="/images/category-necklaces.png" 
                    alt="Detail" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="lg:w-1/2 space-y-8">
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">The Somya Story</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Founded with a vision to make luxury accessible, Somya Fashions brings you meticulously crafted artificial jewellery that tells a story.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Every piece in our collection is thoughtfully designed and expertly finished to rival fine jewellery. We believe that feeling beautiful shouldn't come with a compromise on quality or conscience.
                </p>
                <div className="pt-4">
                  <Link href="/about">
                    <Button variant="link" className="border-b-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none px-0 py-2 h-auto text-lg">
                      Read Our Full Story
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
          <div className="container mx-auto px-4 relative z-10 text-center max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">Join The Club</h2>
            <p className="text-primary-foreground/80 mb-10 text-lg">
              Subscribe to receive updates, access to exclusive deals, and more. Plus, get 10% off your first order.
            </p>
            <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="flex-1 bg-background/10 border border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/50 px-6 py-4 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
                required
              />
              <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 py-4 px-8 rounded-none h-auto uppercase tracking-wider">
                Subscribe
              </Button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
