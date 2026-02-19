"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      // Store the token in localStorage to sync with the auth context
      localStorage.setItem("auth_token", token);

      // Manually dispatch a storage event to trigger auth context update in the same tab
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'auth_token',
        oldValue: null,
        newValue: token,
        url: window.location.href,
        storageArea: localStorage
      }));

      // Remove the token from the URL to prevent it from being visible
      window.history.replaceState({}, document.title, "/auth/callback");

      // Redirect to home page after a short delay to allow state to update
      const timer = setTimeout(() => {
        router.push("/home");
      }, 10);

      return () => clearTimeout(timer);
    } else if (user) {
      // If already authenticated, redirect to home
      router.push("/home");
    }
  }, [token, user, router]);

  return (
    <div className="w-full max-w-sm">
      <Card className="border-primary/20 bg-card/30">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-light">Processing authentication...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm font-light text-muted-foreground">
            Please wait while we complete your login.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}