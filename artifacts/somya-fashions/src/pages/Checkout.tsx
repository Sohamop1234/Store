import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useGetCart, usePlaceOrder, getGetCartQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSessionId } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ChevronLeft, Loader2, LogIn, CheckCircle2, Smartphone } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { useUser } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

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
  const { user, isLoaded: isUserLoaded } = useUser();

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const otpCodeRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Pre-fill form with Clerk user data
  useEffect(() => {
    if (user && isUserLoaded) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      const email = user.emailAddresses[0]?.emailAddress || "";
      const phone = user.phoneNumbers?.[0]?.phoneNumber || "";
      if (fullName) form.setValue("customerName", fullName, { shouldValidate: false });
      if (email) form.setValue("customerEmail", email, { shouldValidate: false });
      if (phone) {
        form.setValue("customerPhone", phone, { shouldValidate: false });
        // If phone comes from verified Clerk account, treat as already verified
        if (user.phoneNumbers?.[0]?.verification?.status === "verified") {
          setOtpVerified(true);
        }
      }
    }
  }, [user, isUserLoaded]);

  // Reset OTP state when phone changes
  const phoneValue = form.watch("customerPhone");
  useEffect(() => {
    setOtpSent(false);
    setOtpInput("");
    setOtpVerified(false);
    otpCodeRef.current = "";
    if (timerRef.current) clearInterval(timerRef.current);
    setOtpResendTimer(0);
  }, [phoneValue]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (!isCartLoading && (!cart || cart.items.length === 0)) {
      toast({
        title: "Cart is empty",
        description: "Please add some items to your cart before checkout.",
        variant: "destructive",
      });
      setLocation("/shop");
    }
  }, [cart, isCartLoading, setLocation, toast]);

  const startResendTimer = () => {
    setOtpResendTimer(30);
    timerRef.current = setInterval(() => {
      setOtpResendTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    const phone = form.getValues("customerPhone");
    if (phone.replace(/\D/g, "").length < 10) {
      toast({ title: "Enter a valid phone number first", variant: "destructive" });
      return;
    }
    setOtpSending(true);
    await new Promise((r) => setTimeout(r, 1200)); // Simulate network call
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpCodeRef.current = code;
    setOtpSent(true);
    setOtpInput("");
    setOtpSending(false);
    startResendTimer();
    // In production, this would call your SMS gateway (Twilio, etc.)
    // For demo, we show the OTP in a toast
    toast({
      title: "OTP Sent",
      description: `Demo OTP: ${code}  (In production this is sent via SMS)`,
    });
  };

  const verifyOtp = () => {
    if (otpInput.trim() === otpCodeRef.current) {
      setOtpVerified(true);
      toast({ title: "Phone verified!", description: "Your phone number has been confirmed." });
    } else {
      toast({ title: "Incorrect OTP", description: "Please check the code and try again.", variant: "destructive" });
      setOtpInput("");
    }
  };

  const onSubmit = (data: CheckoutFormValues) => {
    if (!otpVerified) {
      toast({ title: "Phone not verified", description: "Please verify your phone number with OTP before continuing.", variant: "destructive" });
      return;
    }
    placeOrderMutation.mutate(
      { data: { sessionId, ...data } },
      {
        onSuccess: (order) => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
          localStorage.setItem("somya_session_id", crypto.randomUUID());
          setLocation(`/checkout/payment?orderId=${order.id}&total=${total}`);
        },
        onError: () => {
          toast({
            title: "Checkout Failed",
            description: "There was a problem placing your order. Please try again.",
            variant: "destructive",
          });
        },
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

  // Require sign-in before checkout
  if (isUserLoaded && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 flex items-center justify-center">
          <div className="max-w-sm w-full mx-auto px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-serif text-2xl font-bold mb-3">Sign In to Continue</h2>
            <p className="text-muted-foreground mb-8">
              Please sign in or create an account to complete your purchase.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/sign-in">
                <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline" className="w-full h-12 uppercase tracking-wider">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
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
            <div className="lg:w-1/2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                  {/* Step 1: Contact */}
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                    <h2 className="font-serif text-xl font-bold">Contact Details</h2>
                  </div>

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

                  {/* Phone with OTP */}
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Phone Number
                          {otpVerified && (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-normal">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              placeholder="+91 98765 43210"
                              {...field}
                              disabled={otpVerified}
                              className={otpVerified ? "bg-muted" : ""}
                            />
                            {!otpVerified && (
                              <Button
                                type="button"
                                variant="outline"
                                className="shrink-0 text-sm"
                                onClick={sendOtp}
                                disabled={otpSending || (otpSent && otpResendTimer > 0)}
                              >
                                {otpSending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : otpSent && otpResendTimer > 0 ? (
                                  `Resend (${otpResendTimer}s)`
                                ) : otpSent ? (
                                  "Resend OTP"
                                ) : (
                                  "Send OTP"
                                )}
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />

                        {/* OTP input field */}
                        {otpSent && !otpVerified && (
                          <div className="mt-3 p-4 bg-muted/50 border border-border rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Smartphone className="w-4 h-4 text-primary shrink-0" />
                              <span>Enter the 6-digit OTP sent to your phone</span>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="• • • • • •"
                                maxLength={6}
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                className="text-center tracking-widest font-mono text-lg"
                              />
                              <Button
                                type="button"
                                onClick={verifyOtp}
                                disabled={otpInput.length < 6}
                                className="shrink-0"
                              >
                                Verify
                              </Button>
                            </div>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Step 2: Address */}
                  <div className="flex items-center gap-2 pt-4 pb-4 border-b border-border">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                    <h2 className="font-serif text-xl font-bold">Shipping Address</h2>
                  </div>

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

                  {/* Step 3: Payment notice */}
                  <div className="flex items-center gap-2 pt-4 pb-4 border-b border-border">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                    <h2 className="font-serif text-xl font-bold">Payment</h2>
                  </div>

                  <div className="bg-muted p-4 rounded-lg flex items-start gap-4 border border-border">
                    <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium mb-1">Choose Your Payment Method</h4>
                      <p className="text-sm text-muted-foreground">
                        You'll select UPI, Card, or Cash on Delivery on the next step.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-base uppercase tracking-wider mt-8"
                    disabled={placeOrderMutation.isPending || !otpVerified}
                  >
                    {placeOrderMutation.isPending ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                    ) : !otpVerified ? (
                      "Verify Phone to Continue"
                    ) : (
                      `Continue to Payment • ₹${total.toFixed(2)}`
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
