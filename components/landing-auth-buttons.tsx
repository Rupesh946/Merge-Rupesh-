"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Code2, ArrowRight, Github } from "lucide-react";

export function HeaderAuthButtons() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="h-9 w-32 animate-pulse bg-muted rounded-md" />;
  }

  return (
    <div className="flex items-center space-x-6">
      <Button variant="ghost" size="sm" className="font-light text-xs uppercase tracking-[0.1em]" asChild>
        <Link href={isAuthenticated ? "/home" : "/auth/signin"}>
          {isAuthenticated ? "Feed" : "Enter"}
        </Link>
      </Button>
      <Button size="sm" className="font-light bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-[0.1em] px-6" asChild>
        <Link href={isAuthenticated ? "/home" : "/auth/signin"}>
          {isAuthenticated ? "Go to App" : "Begin"}
        </Link>
      </Button>
    </div>
  );
}

export function HeroAuthButtons() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center space-x-6">
        <div className="h-12 w-32 animate-pulse bg-muted rounded-md" />
        <div className="h-12 w-32 animate-pulse bg-muted rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-6">
      <Button size="lg" className="font-light bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 h-auto text-sm uppercase tracking-[0.1em]" asChild>
        <Link href={isAuthenticated ? "/home" : "/auth/signin"}>
          {isAuthenticated ? null : <Code2 className="mr-3 h-4 w-4" />}
          {isAuthenticated ? "Go to Feed" : "Enter"}
        </Link>
      </Button>
      <Button variant="ghost" size="lg" className="font-light px-0 py-6 h-auto text-sm uppercase tracking-[0.1em] hover:bg-transparent hover:text-primary" asChild>
        <Link href="#work" className="flex items-center space-x-3">
          <span>Explore Work</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}

export function CtaAuthButtons() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="h-14 w-48 animate-pulse bg-muted rounded-md" />;
  }

  return (
    <div className="flex items-center space-x-8">
      <Button size="lg" className="font-light bg-foreground text-background hover:bg-foreground/90 px-8 py-6 h-auto text-sm uppercase tracking-[0.1em]" asChild>
        <Link href={isAuthenticated ? "/home" : "/auth/signin"}>
          {isAuthenticated ? null : <Github className="mr-3 h-4 w-4" />}
          {isAuthenticated ? "Enter Feed" : "Enter Space"}
        </Link>
      </Button>
      <div className="text-xs font-light text-muted-foreground">
        <div>For those who craft code</div>
        <div>Always free</div>
      </div>
    </div>
  );
}
