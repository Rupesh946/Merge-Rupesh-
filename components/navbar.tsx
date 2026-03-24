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
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

interface NavbarProps {
  currentPage?: string;
}

export function Navbar({ currentPage }: NavbarProps) {
  const [showMessages, setShowMessages] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const [unreadGeneralCount, setUnreadGeneralCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Global notification poller
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const fetchCounts = async () => {
      // Don't poll if the tab is in the background
      if (document.hidden) return;
      
      try {
        const res = await api.getNotifications({ unread: true, page: 1 });
        setUnreadGeneralCount(res.unreadCount || 0);
        setUnreadMessagesCount(res.unreadMessagesCount || 0);
      } catch (error) {
        // Silently fail if API throws
      }
    };

    if (isAuthenticated) {
      fetchCounts(); // Initial fetch
      
      interval = setInterval(() => {
        fetchCounts();
      }, 60000); // Polling every 60 seconds (reduced from 5s to prevent DB connection exhaustion)
      
      // Also fetch when tab becomes visible again
      const handleVisibilityChange = () => {
        if (!document.hidden) fetchCounts();
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      
      return () => {
        if (interval) clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated]);

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
                  {unreadMessagesCount > 0 && (
                    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground border-2 border-background">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </div>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative"
                  asChild
                  onClick={() => setUnreadGeneralCount(0)} // Optimistic clear on click
                >
                  <Link href="/notifications">
                    <Bell className="h-4 w-4" />
                    {unreadGeneralCount > 0 && (
                      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground border-2 border-background">
                        {unreadGeneralCount > 9 ? '9+' : unreadGeneralCount}
                      </div>
                    )}
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