import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListProducts, useGetCategories } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Shop() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || undefined;
  const initialSearch = searchParams.get("search") || undefined;

  const [category, setCategory] = useState<string | undefined>(initialCategory);
  const [search, setSearch] = useState<string | undefined>(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch || "");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState([0, 10000]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const { data: categories } = useGetCategories();
  
  // Update URL when category changes to make it shareable
  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    
    const newUrl = params.toString() ? `/shop?${params.toString()}` : "/shop";
    window.history.replaceState({}, "", newUrl);
  }, [category, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 500);
    return () => clearTimeout(timer);
  }, [priceRange]);

  const { data: products, isLoading } = useListProducts({
    category,
    search,
    minPrice: debouncedPriceRange[0] > 0 ? debouncedPriceRange[0] : undefined,
    maxPrice: debouncedPriceRange[1] < 10000 ? debouncedPriceRange[1] : undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput || undefined);
  };

  const clearFilters = () => {
    setCategory(undefined);
    setSearch(undefined);
    setSearchInput("");
    setPriceRange([0, 10000]);
    setDebouncedPriceRange([0, 10000]);
  };

  const activeFiltersCount = 
    (category ? 1 : 0) + 
    (search ? 1 : 0) + 
    (debouncedPriceRange[0] > 0 || debouncedPriceRange[1] < 10000 ? 1 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="bg-muted/30 py-12 border-b border-border">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              {category ? `${category} Collection` : "All Jewellery"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our complete collection of meticulously crafted artificial jewellery. 
              Find the perfect piece to elevate your look.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Mobile Filter Button */}
            <div className="lg:hidden flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                onClick={() => setIsMobileFiltersOpen(true)}
                className="w-full flex items-center justify-center"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Button>
            </div>

            {/* Sidebar Filters */}
            <div className={cn(
              "lg:w-1/4 flex-shrink-0 space-y-8",
              "fixed inset-0 z-50 bg-background lg:static lg:bg-transparent lg:z-auto p-6 lg:p-0 overflow-y-auto lg:overflow-visible transition-transform transform lg:transform-none",
              isMobileFiltersOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
              <div className="flex items-center justify-between lg:hidden mb-6">
                <h2 className="font-serif text-xl font-bold">Filters</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileFiltersOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Search */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-semibold border-b border-border pb-2">Search</h3>
                <form onSubmit={handleSearch} className="relative">
                  <Input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pr-10"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                    <Search className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-semibold border-b border-border pb-2">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setCategory(undefined)}
                    className={cn(
                      "block w-full text-left py-1 text-sm transition-colors",
                      !category ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All Categories
                  </button>
                  {categories?.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => setCategory(cat.name)}
                      className={cn(
                        "block w-full text-left py-1 text-sm transition-colors flex justify-between",
                        category === cat.name ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs opacity-50">({cat.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-semibold border-b border-border pb-2">Price Range</h3>
                <div className="pt-4 px-2">
                  <Slider
                    value={priceRange}
                    max={10000}
                    step={100}
                    onValueChange={setPriceRange}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                  <span>₹{priceRange[0]}</span>
                  <span>₹{priceRange[1] === 10000 ? "10,000+" : priceRange[1]}</span>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full mt-6"
                >
                  Clear All Filters
                </Button>
              )}

              <div className="lg:hidden mt-8">
                <Button 
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full bg-primary text-primary-foreground"
                >
                  Apply Filters
                </Button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="lg:w-3/4">
              {/* Active filters display */}
              <div className="flex flex-wrap items-center gap-2 mb-6 min-h-[32px]">
                {category && (
                  <span className="inline-flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-xs">
                    {category}
                    <button onClick={() => setCategory(undefined)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {search && (
                  <span className="inline-flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-xs">
                    "{search}"
                    <button onClick={() => { setSearch(undefined); setSearchInput(""); }} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {(debouncedPriceRange[0] > 0 || debouncedPriceRange[1] < 10000) && (
                  <span className="inline-flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-xs">
                    ₹{debouncedPriceRange[0]} - ₹{debouncedPriceRange[1]}
                    <button onClick={() => setPriceRange([0, 10000])} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                )}
                <div className="ml-auto text-sm text-muted-foreground">
                  {products ? `${products.length} Products` : "Loading..."}
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
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
              ) : products && products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {products.map((product, i) => (
                      <ProductCard key={product.id} product={product} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-24 bg-muted/20 rounded-lg border border-border">
                  <h3 className="font-serif text-2xl font-bold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-6">Try adjusting your filters to find what you're looking for.</p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Utility function for conditional classes that might be missing if not imported in Navbar
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
