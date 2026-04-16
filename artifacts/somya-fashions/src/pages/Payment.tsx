import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreatePayment, useConfirmPayment } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Banknote, Smartphone } from "lucide-react";

export function Payment() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const orderId = new URLSearchParams(search).get("orderId");
  const { toast } = useToast();

  const [method, setMethod] = useState<"upi" | "card" | "cod">("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const createPayment = useCreatePayment();
  const confirmPayment = useConfirmPayment();

  useEffect(() => {
    if (!orderId) {
      setLocation("/shop");
    }
  }, [orderId, setLocation]);

  const handlePayment = async () => {
    if (!orderId) return;

    if (method === "upi" && !upiId) {
      toast({ title: "UPI ID required", variant: "destructive" });
      return;
    }
    if (method === "card" && (!cardNumber || !expiry || !cvv || !cardName)) {
      toast({ title: "All card details required", variant: "destructive" });
      return;
    }

    try {
      const paymentParams: any = {
        orderId: Number(orderId),
        method,
      };

      if (method === "upi") {
        paymentParams.upiId = upiId;
      } else if (method === "card") {
        paymentParams.cardLast4 = cardNumber.slice(-4) || "0000";
      }

      const payment = await createPayment.mutateAsync({ data: paymentParams });

      if (method === "cod") {
        setLocation(`/order-success?id=${orderId}`);
        return;
      }

      // Simulate payment processing
      const transactionRef = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await confirmPayment.mutateAsync({
        id: payment.id,
        data: { transactionRef }
      });

      setLocation(`/order-success?id=${orderId}`);
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment.",
        variant: "destructive"
      });
    }
  };

  const isProcessing = createPayment.isPending || confirmPayment.isPending;

  if (!orderId) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-32 pb-16 flex justify-center">
        <div className="container max-w-md px-4">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-8 text-center">
            Complete Payment
          </h1>

          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <RadioGroup value={method} onValueChange={(v: any) => setMethod(v)} className="space-y-4">
              {/* UPI */}
              <div className={`border rounded-lg p-4 transition-colors ${method === 'upi' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex items-center font-medium cursor-pointer">
                    <Smartphone className="w-5 h-5 mr-2 text-primary" />
                    UPI Payment
                  </Label>
                </div>
                {method === "upi" && (
                  <div className="pl-8 pt-2 space-y-3 animate-in fade-in zoom-in duration-200">
                    <p className="text-xs text-muted-foreground">Merchant: somyafashions@upi</p>
                    <div className="space-y-2">
                      <Label>Your UPI ID</Label>
                      <Input 
                        placeholder="example@upi" 
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Card */}
              <div className={`border rounded-lg p-4 transition-colors ${method === 'card' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center font-medium cursor-pointer">
                    <CreditCard className="w-5 h-5 mr-2 text-primary" />
                    Credit / Debit Card
                  </Label>
                </div>
                {method === "card" && (
                  <div className="pl-8 pt-2 space-y-4 animate-in fade-in zoom-in duration-200">
                    <div className="space-y-2">
                      <Label>Cardholder Name</Label>
                      <Input 
                        placeholder="Jane Doe" 
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Card Number</Label>
                      <Input 
                        placeholder="0000 0000 0000 0000" 
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Expiry (MM/YY)</Label>
                        <Input 
                          placeholder="MM/YY" 
                          maxLength={5}
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CVV</Label>
                        <Input 
                          placeholder="123" 
                          type="password"
                          maxLength={4}
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* COD */}
              <div className={`border rounded-lg p-4 transition-colors ${method === 'cod' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex items-center font-medium cursor-pointer">
                    <Banknote className="w-5 h-5 mr-2 text-primary" />
                    Cash on Delivery
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Button 
              className="w-full mt-8 h-12 text-base" 
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
              ) : (
                method === 'cod' ? 'Complete Order' : 'Pay Now'
              )}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
