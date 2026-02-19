"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus } from "lucide-react";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-foreground flex items-center justify-center">
              <Minus className="h-2 w-2 text-background" />
            </div>
            <span className="text-base font-light tracking-[0.2em]">MERGE</span>
          </Link>
        </div>

        <Card className="border-primary/20 bg-card/30">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-light">Sign up</CardTitle>
            <CardDescription className="font-light text-sm">
              Create an account to join the community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SignUpForm />

            <div className="text-center">
              <p className="text-sm font-light text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
