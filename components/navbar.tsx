"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessagesModal } from "@/components/messages-modal";
import {
  Bell,
  MessageCircle,
  Settings,
  Minus
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

interface NavbarProps {
  currentPage?: string;
}

export function Navbar({ currentPage }: NavbarProps) {
  const [showMessages, setShowMessages] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <header className="fixed top-0 w-full z-40 bg-background/80 backdrop-blur-sm border-b border-border/20">
      <div className="max-w-8xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-foreground flex items-center justify-center">
                <Minus className="h-2 w-2 text-background" />
              </div>
              <span className="text-base font-light tracking-[0.2em]">MERGE</span>
            </Link>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-12">
            <Link 
              href="/home" 
              className={`text-xs font-light uppercase tracking-[0.15em] transition-colors ${
                currentPage === 'home' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Feed
            </Link>
            <Link 
              href="/projects" 
              className={`text-xs font-light uppercase tracking-[0.15em] transition-colors ${
                currentPage === 'projects' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Projects
            </Link>

          </nav>
          
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative"
                  onClick={() => setShowMessages(!showMessages)}
                >
                  <MessageCircle className="h-4 w-4" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative"
                  asChild
                >
                  <Link href="/notifications">
                    <Bell className="h-4 w-4" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                <Link href="/profile">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={user?.image || "/api/placeholder/32/32"} />
                    <AvatarFallback className="text-xs">
                      {user?.name?.[0] || user?.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="font-light" asChild>
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
                <Button size="sm" className="font-light bg-primary text-primary-foreground" asChild>
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <MessagesModal
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
      />
    </header>
  );
}