"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      // OAuth failed — redirect to sign-in with error message
      window.location.href = `/auth/signin?error=${error}`;
      return;
    }

    if (token) {
      // Store the JWT in localStorage
      localStorage.setItem("auth_token", token);

      // Use a hard redirect so the page fully reloads and the
      // auth context re-initializes from scratch with the new token.
      // This is the most reliable way to ensure the user is logged in.
      window.location.href = "/home";
    } else {
      // No token and no error — just go to sign-in
      window.location.href = "/auth/signin";
    }
  }, [token, error]);

  return (
    <div className="w-full max-w-sm">
      <Card className="border-primary/20 bg-card/30">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
          <CardTitle className="text-xl font-light">Signing you in...</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm font-light text-muted-foreground">
            Almost there, just a moment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Suspense fallback={
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-light">Loading...</span>
        </div>
      }>
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}