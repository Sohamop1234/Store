import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreatePayment, useConfirmPayment } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, CreditCard, Banknote, Smartphone,
  CheckCircle2, ShieldCheck, ArrowRight, Clock, ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Step = "select" | "confirm" | "processing" | "done";

export function Payment() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const orderId = new URLSearchParams(search).get("orderId");
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("select");
  const [method, setMethod] = useState<"upi" | "card" | "cod">("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = Number(new URLSearchParams(search).get("total") || "0");

  const createPayment = useCreatePayment();
  const confirmPayment = useConfirmPayment();

  useEffect(() => {
    if (!orderId) setLocation("/shop");
  }, [orderId, setLocation]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const validateDetails = () => {
    if (method === "upi" && !upiId.trim()) {
      toast({ title: "UPI ID required", description: "Please enter your UPI ID.", variant: "destructive" });
      return false;
    }
    if (method === "card") {
      if (!cardName.trim() || !cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
        toast({ title: "All card details required", variant: "destructive" });
        return false;
      }
      if (cardNumber.replace(/\s/g, "").length < 16) {
        toast({ title: "Invalid card number", description: "Please enter a valid 16-digit card number.", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const proceedToConfirm = () => {
    if (!validateDetails()) return;
    setStep("confirm");
  };

  const handlePayment = async () => {
    if (!orderId) return;
    setStep("processing");

    // For UPI start a countdown
    if (method === "upi") {
      setCountdown(15);
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }

    try {
      const paymentParams: any = {
        orderId: Number(orderId),
        method,
      };
      if (method === "upi") paymentParams.upiId = upiId;
      else if (method === "card") paymentParams.cardLast4 = cardNumber.replace(/\s/g, "").slice(-4) || "0000";

      const payment = await createPayment.mutateAsync({ data: paymentParams });

      if (method === "upi") {
        // Wait for countdown to finish to simulate real UPI polling
        await new Promise((res) => setTimeout(res, 15000));
        if (timerRef.current) clearInterval(timerRef.current);
      } else if (method === "card") {
        // Simulate 3D Secure / bank processing delay
        await new Promise((res) => setTimeout(res, 4000));
      } else {
        await new Promise((res) => setTimeout(res, 1500));
      }

      if (method !== "cod") {
        const transactionRef = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        await confirmPayment.mutateAsync({ id: payment.id, data: { transactionRef } });
      }

      setStep("done");
      setTimeout(() => setLocation(`/order-success?id=${orderId}`), 2000);
    } catch {
      if (timerRef.current) clearInterval(timerRef.current);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      setStep("select");
    }
  };

  const formatCard = (val: string) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const methodLabel = method === "upi" ? "UPI" : method === "card" ? "Card" : "Cash on Delivery";

  if (!orderId) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-32 pb-16 flex justify-center">
        <div className="container max-w-md px-4">

          <AnimatePresence mode="wait">

            {/* STEP: Select & Enter Details */}
            {step === "select" && (
              <motion.div key="select" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2 text-center">Payment</h1>
                <p className="text-muted-foreground text-sm text-center mb-8">Choose your payment method</p>

                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <RadioGroup value={method} onValueChange={(v: any) => setMethod(v)} className="space-y-4">

                    {/* UPI */}
                    <div className={`border rounded-lg p-4 transition-colors ${method === "upi" ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center space-x-3 mb-2">
                        <RadioGroupItem value="upi" id="upi" />
                        <Label htmlFor="upi" className="flex items-center font-medium cursor-pointer">
                          <Smartphone className="w-5 h-5 mr-2 text-primary" /> UPI Payment
                        </Label>
                      </div>
                      {method === "upi" && (
                        <div className="pl-8 pt-2 space-y-3 animate-in fade-in zoom-in duration-200">
                          <p className="text-xs text-muted-foreground">Merchant UPI: <span className="font-mono">somyafashions@upi</span></p>
                          <div className="space-y-2">
                            <Label>Your UPI ID</Label>
                            <Input placeholder="example@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card */}
                    <div className={`border rounded-lg p-4 transition-colors ${method === "card" ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center space-x-3 mb-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center font-medium cursor-pointer">
                          <CreditCard className="w-5 h-5 mr-2 text-primary" /> Credit / Debit Card
                        </Label>
                      </div>
                      {method === "card" && (
                        <div className="pl-8 pt-2 space-y-4 animate-in fade-in zoom-in duration-200">
                          <div className="space-y-2">
                            <Label>Cardholder Name</Label>
                            <Input placeholder="Jane Doe" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Card Number</Label>
                            <Input
                              placeholder="0000 0000 0000 0000"
                              maxLength={19}
                              value={cardNumber}
                              onChange={(e) => setCardNumber(formatCard(e.target.value))}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Expiry (MM/YY)</Label>
                              <Input
                                placeholder="MM/YY"
                                maxLength={5}
                                value={expiry}
                                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>CVV</Label>
                              <Input
                                placeholder="•••"
                                type="password"
                                maxLength={4}
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* COD */}
                    <div className={`border rounded-lg p-4 transition-colors ${method === "cod" ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="flex items-center font-medium cursor-pointer">
                          <Banknote className="w-5 h-5 mr-2 text-primary" /> Cash on Delivery
                        </Label>
                      </div>
                      {method === "cod" && (
                        <p className="text-xs text-muted-foreground pl-8 pt-2">Pay with cash when your order arrives.</p>
                      )}
                    </div>
                  </RadioGroup>

                  <Button className="w-full mt-8 h-12 text-base" onClick={proceedToConfirm}>
                    Review Payment <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP: Confirm */}
            {step === "confirm" && (
              <motion.div key="confirm" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2 text-center">Confirm Payment</h1>
                <p className="text-muted-foreground text-sm text-center mb-8">Review your order before paying</p>

                <div className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-5">
                  {/* Order total */}
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground text-sm">Order Total</span>
                    <span className="font-bold text-2xl text-primary">₹{total.toFixed(2)}</span>
                  </div>

                  {/* Payment method summary */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Method</span>
                      <span className="font-medium">{methodLabel}</span>
                    </div>
                    {method === "upi" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">UPI ID</span>
                        <span className="font-mono font-medium">{upiId}</span>
                      </div>
                    )}
                    {method === "card" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Card</span>
                          <span className="font-mono font-medium">•••• •••• •••• {cardNumber.replace(/\s/g, "").slice(-4)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium">{cardName}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-start gap-3 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Your payment details are secure and encrypted. By confirming, you agree to our terms.</span>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <Button className="w-full h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90" onClick={handlePayment}>
                      {method === "cod" ? "Confirm Order" : `Pay ₹${total.toFixed(2)}`}
                    </Button>
                    <button
                      className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setStep("select")}
                    >
                      <ChevronLeft className="w-4 h-4" /> Change Payment Method
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP: Processing */}
            {step === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                {method === "upi" ? (
                  <div className="space-y-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Smartphone className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="font-serif text-2xl font-bold">UPI Request Sent</h2>
                    <p className="text-muted-foreground">
                      A payment request has been sent to <span className="font-mono font-medium">{upiId}</span>.<br />
                      Please approve it in your UPI app.
                    </p>
                    {countdown > 0 && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Waiting for confirmation… {countdown}s</span>
                      </div>
                    )}
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 15, ease: "linear" }}
                      />
                    </div>
                  </div>
                ) : method === "card" ? (
                  <div className="space-y-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                    <h2 className="font-serif text-2xl font-bold">Verifying Payment</h2>
                    <p className="text-muted-foreground">
                      We're securely processing your card payment.<br />Please do not close this page.
                    </p>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                      <span>Secured by 256-bit SSL encryption</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                    <h2 className="font-serif text-2xl font-bold">Placing Your Order</h2>
                    <p className="text-muted-foreground">Confirming your order, just a moment…</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP: Done */}
            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="font-serif text-2xl font-bold">Payment Confirmed!</h2>
                <p className="text-muted-foreground">Redirecting to your order…</p>
                <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}
