"use client";

import { useActionState, startTransition, useState } from "react";
import Image from "next/image";
import { loginAction } from "@/app/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User as UserIcon, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background p-6">
      {/* Very subtle background light blur to maintain clean look */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[380px] z-10 space-y-6">
        {/* Brand Logo & Subtitle */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative w-[180px] h-[55px] flex items-center justify-center">
            <Image
              src="/images/Logo-BSG.png"
              alt="Bank BSG Logo"
              fill
              priority
              className="object-contain dark:brightness-110"
            />
          </div>
          <div className="text-center">
            <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
              E-Arsip Pemindahbukuan
            </h2>
          </div>
        </div>

        <Card className="border border-border shadow-sm bg-card/45 backdrop-blur-md rounded-xl">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6 pb-6">
              {state?.error && (
                <Alert variant="destructive" className="py-2 px-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive">
                  <AlertDescription className="text-2xs font-semibold flex items-center gap-1.5 justify-center text-center">
                    {state.error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Username Input */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">
                  Username
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60 pointer-events-none">
                    <UserIcon className="h-3.5 w-3.5" />
                  </span>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Username"
                    className="pl-9 pr-4 py-1.5 bg-background/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-xs transition-colors"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60 pointer-events-none">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-10 py-1.5 bg-background/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-xs transition-colors"
                    required
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                    aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>


              <Button
                type="submit"
                className="w-full mt-2 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs rounded-lg transition-all duration-200"
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center gap-1.5 justify-center">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  "MASUK"
                )}
              </Button>
            </CardContent>
          </form>
        </Card>

        {/* Footer info */}
        <div className="text-center text-3xs text-muted-foreground/70">
          <p>© PT. Bank SulutGo.</p>
        </div>
      </div>
    </div>
  );
}
