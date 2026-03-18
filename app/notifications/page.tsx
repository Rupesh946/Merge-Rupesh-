"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { api, Notification } from "@/lib/api";
import {
  Bell, Heart, MessageCircle, UserPlus, Star,
  GitFork, CheckCheck, Loader2, ArrowRight,
} from "lucide-react";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type NotificationType = "like" | "comment" | "follow" | "star" | "fork" | string;

const TYPE_CONFIG: Record<string, {
  icon: React.ReactNode;
  bg: string;
  border: string;
  label: string;
}> = {
  like: {
    icon: <Heart className="h-5 w-5 text-red-400 fill-red-400/30" />,
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Like",
  },
  comment: {
    icon: <MessageCircle className="h-5 w-5 text-blue-400" />,
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    label: "Comment",
  },
  follow: {
    icon: <UserPlus className="h-5 w-5 text-green-400" />,
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    label: "Follow",
  },
  star: {
    icon: <Star className="h-5 w-5 text-yellow-400 fill-yellow-400/30" />,
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: "Star",
  },
  fork: {
    icon: <GitFork className="h-5 w-5 text-purple-400" />,
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    label: "Fork",
  },
};

const getConfig = (type: string) =>
  TYPE_CONFIG[type] ?? {
    icon: <Bell className="h-5 w-5 text-muted-foreground" />,
    bg: "bg-muted/30",
    border: "border-border/20",
    label: "Notification",
  };

// Guess the link based on message content and targetId
function getLink(n: Notification): string | null {
  if (!n.targetId) return null;
  if (n.type === "comment" || n.type === "like") {
    // Could be a post or project — default to post link, projects page uses /projects/[id]
    if (n.message.toLowerCase().includes("project")) return `/projects/${n.targetId}`;
    return `/home`; // posts don't have a dedicated page route yet
  }
  if (n.type === "follow") return null; // link to their profile would need sender info
  return null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    setLoading(true);
    api.getNotifications()
      .then((d) => {
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await api.markNotificationRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const displayed = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  // Group by type for the filter counts
  const typeCounts = notifications.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage="notifications" />

      <div className="pt-20 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto py-10">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-light tracking-tight flex items-center gap-3">
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-sm font-bold px-2.5 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-light">
                Activity on your posts, projects, and profile
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="font-light gap-2 mt-1"
                onClick={markAllRead}
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Type summary badges */}
          {!loading && notifications.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(typeCounts).map(([type, count]) => {
                const cfg = getConfig(type);
                return (
                  <span
                    key={type}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.border}`}
                  >
                    {cfg.icon}
                    {count} {cfg.label}{count !== 1 ? "s" : ""}
                  </span>
                );
              })}
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-1 mb-6 border-b border-border/20">
            {(["all", "unread"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 text-sm font-light capitalize transition-colors border-b-2 -mb-px ${
                  filter === tab
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {tab === "unread" && unreadCount > 0 && (
                  <span className="ml-1.5 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-light">Loading notifications...</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="font-medium mb-1">
                  {filter === "unread" ? "You're all caught up!" : "No notifications yet"}
                </p>
                <p className="text-sm text-muted-foreground font-light">
                  {filter === "unread"
                    ? "No unread notifications."
                    : "When someone likes, comments, or follows you, it'll appear here."}
                </p>
              </div>
              {filter === "unread" && (
                <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>
                  View all notifications
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {displayed.map((n) => {
                const cfg = getConfig(n.type);
                const link = getLink(n);
                const CardContent = (
                  <div
                    onClick={() => !n.read && markRead(n.id)}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all group ${
                      !n.read
                        ? `${cfg.border} ${cfg.bg} hover:brightness-110`
                        : "border-border/10 hover:bg-muted/20 bg-card/20"
                    } ${link ? "cursor-pointer" : !n.read ? "cursor-pointer" : ""}`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {n.title && (
                            <p className="text-sm font-semibold mb-0.5">{n.title}</p>
                          )}
                          <p className="text-sm text-foreground/85 leading-snug">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-1.5 font-light">{timeAgo(n.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!n.read && (
                            <div className="w-2.5 h-2.5 bg-primary rounded-full" title="Unread" />
                          )}
                          {link && (
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );

                return link ? (
                  <Link key={n.id} href={link} onClick={() => !n.read && markRead(n.id)}>
                    {CardContent}
                  </Link>
                ) : (
                  <div key={n.id}>{CardContent}</div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
