"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api, Notification } from "@/lib/api";
import {
  Bell, Heart, MessageCircle, UserPlus, X, Star,
} from "lucide-react";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const getIcon = (type: string) => {
  switch (type) {
    case "like": return <Heart className="h-4 w-4 text-red-400" />;
    case "comment": return <MessageCircle className="h-4 w-4 text-blue-400" />;
    case "follow": return <UserPlus className="h-4 w-4 text-green-400" />;
    case "star": return <Star className="h-4 w-4 text-yellow-400" />;
    default: return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.getNotifications()
      .then((d) => {
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const markRead = async (id: string) => {
    await api.markNotificationRead(id).catch(() => { });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead().catch(() => { });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16">
      <div className="fixed inset-0 bg-background/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[380px] max-h-[85vh] bg-card border border-border/30 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-primary hover:opacity-70 transition-opacity"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">No notifications yet</p>
              <p className="text-xs text-muted-foreground">
                Activity on your posts will appear here
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`flex items-start gap-3 px-4 py-3.5 border-b border-border/10 transition-colors cursor-pointer ${!n.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                  }`}
              >
                <div className="mt-0.5 flex-shrink-0">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  {n.title && (
                    <p className="text-xs font-semibold mb-0.5">{n.title}</p>
                  )}
                  <p className="text-sm text-foreground/80 leading-snug">{n.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="mt-1.5 w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}