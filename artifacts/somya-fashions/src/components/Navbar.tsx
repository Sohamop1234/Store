import { Link, useLocation } from "wouter";
import { ShoppingBag, Search, Menu, LogIn, LogOut, UserCircle } from "lucide-react";
import { useGetCart } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUser, useClerk } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Navbar() {
  const [location] = useLocation();
  const sessionId = getSessionId();
  const { data: cart } = useGetCart({ sessionId }, { query: { enabled: !!sessionId } });
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const itemCount = cart?.itemCount || 0;

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Necklaces", href: "/shop?category=Necklaces" },
    { name: "Earrings", href: "/shop?category=Earrings" },
  ];

  const handleSignOut = () => {
    signOut({ redirectUrl: `${basePath}/` });
  };

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-border shadow-sm py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-foreground">
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.slice(0, 2).map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-sm uppercase tracking-wider font-medium hover:text-primary transition-colors",
                  location === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex-1 text-center md:flex-none">
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-primary">
                Somya
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4 md:gap-6 justify-end">
            <div className="hidden md:flex items-center gap-6">
              {navLinks.slice(2).map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm uppercase tracking-wider font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <button className="text-foreground hover:text-primary transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* Auth button */}
            <div className="hidden md:flex items-center">
              {isLoaded && user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.firstName || "User"}
                        className="w-7 h-7 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <UserCircle className="w-5 h-5 text-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground hidden lg:block">
                      {user.firstName || user.emailAddresses[0]?.emailAddress?.split("@")[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : isLoaded ? (
                <Link
                  href="/sign-in"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="uppercase tracking-wider font-medium">Sign In</span>
                </Link>
              ) : null}
            </div>

            <Link href="/cart" className="relative text-foreground hover:text-primary transition-colors">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-background border-b border-border shadow-lg md:hidden">
          <div className="flex flex-col py-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-6 py-3 text-sm uppercase tracking-wider font-medium text-foreground hover:bg-muted transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-border mt-2 pt-2">
              {user ? (
                <button
                  onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                  className="w-full text-left px-6 py-3 text-sm uppercase tracking-wider font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-6 py-3 text-sm uppercase tracking-wider font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-6 py-3 text-sm uppercase tracking-wider font-medium text-primary hover:bg-muted transition-colors"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
