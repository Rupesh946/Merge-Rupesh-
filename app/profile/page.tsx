// This page handles /profile and redirects to /profile/[current-username]
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user && user.username) {
        // Redirect to the user's profile page
        router.push(`/profile/${user.username}`);
      } else if (!isAuthenticated) {
        // If not logged in, redirect to sign in
        router.push('/auth/signin');
      } else {
        // If user doesn't have a username, show an error or prompt to set it
        // For now, redirect to sign in
        router.push('/auth/signin');
      }
    }
  }, [user, loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}