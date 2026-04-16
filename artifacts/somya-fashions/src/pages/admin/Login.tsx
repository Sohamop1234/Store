import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useAdminLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    loginMutation.mutate(
      { data: { password } },
      {
        onSuccess: (data) => {
          localStorage.setItem("somya_admin_token", data.token);
          toast({ title: "Logged in successfully" });
          setLocation("/admin");
        },
        onError: () => {
          toast({ 
            title: "Login failed", 
            description: "Invalid password", 
            variant: "destructive" 
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-8"
      >
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-serif font-bold text-center mb-2">Admin Access</h1>
        <p className="text-muted-foreground text-center text-sm mb-8">
          Enter the admin password to continue
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12"
            disabled={loginMutation.isPending || !password}
          >
            {loginMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Login to Dashboard"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
