"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle,
  Send,
  X,
  Search,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { api, Conversation, Message, User } from "@/lib/api";

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewState = "list" | "search" | "chat";

export function MessagesModal({ isOpen, onClose }: MessagesModalProps) {
  const { user } = useAuth();
  const [view, setView] = useState<ViewState>("list");
  
  // List State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Chat State
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Focus effect for scrolling to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 1. Fetch Conversations
  useEffect(() => {
    if (isOpen && view === "list") {
      fetchConversations();
    }
  }, [isOpen, view]);

  const fetchConversations = async () => {
    try {
      setLoadingList(true);
      const res = await api.getConversations();
      setConversations(res.conversations || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoadingList(false);
    }
  };

  // 2. Poll Messages individually when in "chat" view
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && view === "chat" && activeConversation) {
      // initial fetch
      fetchMessages(activeConversation.id);
      
      // polling
      interval = setInterval(() => {
        fetchMessages(activeConversation.id, true);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isOpen, view, activeConversation]);

  const fetchMessages = async (convId: string, background = false) => {
    try {
      const res = await api.getMessages(convId);
      setMessages(res.messages || []);
      if (!background) scrollToBottom();
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  // 3. Search Users
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1 && view === "search") {
        setIsSearching(true);
        try {
          const res = await api.searchUsers(searchQuery);
          setSearchResults(res.users);
        } catch (error) {
          console.error(error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, view]);

  const handleStartConversation = async (targetUserId: string) => {
    try {
      const res = await api.startConversation(targetUserId);
      setActiveConversation(res.conversation);
      setView("chat");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftMessage.trim() || !activeConversation || sending) return;

    const content = draftMessage.trim();
    setDraftMessage("");
    setSending(true);

    try {
      // Optimistic upate (optional), here we just wait for API
      await api.sendMessage(activeConversation.id, content);
      await fetchMessages(activeConversation.id);
      scrollToBottom();
    } catch (error) {
      console.error("Failed to send message", error);
      setDraftMessage(content); // restore on fail
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    if (!user) return null;
    return conv.participants.find(p => p.user.id !== user.id)?.user;
  };

  // If closed, don't render
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20">
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      
      <Card className="relative w-80 max-h-[80vh] flex flex-col overflow-hidden border-primary/20 bg-card shadow-2xl z-10">
        
        {/* HEADER */}
        <div className="p-4 border-b border-primary/20 bg-primary/5 shrink-0">
          <div className="flex items-center justify-between mb-3">
            {view !== "list" && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                setView("list");
                setActiveConversation(null);
                setSearchQuery("");
              }}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <h3 className="text-lg font-light text-primary flex-1 text-center">
              {view === "list" ? "Messages" : view === "search" ? "New Message" : getOtherParticipant(activeConversation!)?.name}
            </h3>
            
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {view === "list" && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-9 h-9 bg-muted/30 border-primary/20 font-light text-sm focus:border-primary/40"
              />
            </div>
          )}

          {view === "search" && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users to message..." 
                className="pl-9 h-9 bg-muted/30 border-primary/20 font-light text-sm focus:border-primary/40"
              />
            </div>
          )}
        </div>
        
        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-[300px]">
          
          {/* ----- LIST VIEW ----- */}
          {view === "list" && (
            <div className="flex flex-col h-full overflow-y-auto">
               {loadingList ? (
                 <div className="flex-1 flex items-center justify-center p-4 text-muted-foreground">
                   <Loader2 className="h-5 w-5 animate-spin" />
                 </div>
               ) : conversations.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                   <MessageCircle className="h-10 w-10 mb-2 opacity-20" />
                   <p className="text-sm">No conversations yet</p>
                 </div>
               ) : (
                 <div className="flex-1">
                   {conversations.map((conv) => {
                     const other = getOtherParticipant(conv);
                     if (!other) return null;
                     const lastMsg = conv.messages?.[0];

                     return (
                       <div 
                         key={conv.id} 
                         onClick={() => {
                           setActiveConversation(conv);
                           setView("chat");
                         }}
                         className="p-3 border-b border-border/10 hover:bg-primary/5 cursor-pointer flex items-center space-x-3 transition-colors"
                       >
                         <Avatar className="h-10 w-10 shrink-0">
                           <AvatarImage src={other.image || ""} />
                           <AvatarFallback className="text-xs">{other.name[0]}</AvatarFallback>
                         </Avatar>
                         
                         <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-baseline mb-0.5">
                             <p className="text-sm font-medium truncate">{other.name}</p>
                             {lastMsg && (
                               <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                 {new Date(lastMsg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric'})}
                               </span>
                             )}
                           </div>
                           <p className="text-xs text-muted-foreground truncate">
                             {lastMsg ? lastMsg.content : "Start a conversation"}
                           </p>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>
          )}

          {/* ----- SEARCH VIEW ----- */}
          {view === "search" && (
            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                 <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
              ) : searchResults.length > 0 ? (
                searchResults.map(u => (
                  <div 
                     key={u.id} 
                     onClick={() => handleStartConversation(u.id)}
                     className="p-3 border-b border-border/10 hover:bg-primary/5 cursor-pointer flex items-center space-x-3"
                   >
                     <Avatar className="h-8 w-8">
                       <AvatarImage src={u.image || ""} />
                       <AvatarFallback className="text-xs">{u.name[0]}</AvatarFallback>
                     </Avatar>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-medium truncate">{u.name}</p>
                       <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                     </div>
                   </div>
                ))
              ) : searchQuery.length > 1 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">Type to search for users</div>
              )}
            </div>
          )}

          {/* ----- CHAT VIEW ----- */}
          {view === "chat" && activeConversation && (
            <div className="flex flex-col h-full bg-background/50">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground mt-10">
                    No messages here yet. Say hi!
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender.id === user?.id;
                    return (
                      <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          isMe 
                            ? 'bg-primary text-primary-foreground rounded-br-sm' 
                            : 'bg-muted text-foreground rounded-bl-sm border border-border/50'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Box */}
              <div className="p-3 bg-card border-t shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input 
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!draftMessage.trim() || sending}
                    className="rounded-full shrink-0"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                  </Button>
                </form>
              </div>
            </div>
          )}

        </div>
        
        {/* FOOTER - Only in List View */}
        {view === "list" && (
          <div className="p-4 border-t border-primary/20 shrink-0">
            <Button 
              className="w-full font-light bg-primary text-primary-foreground" 
              size="sm"
              onClick={() => setView("search")}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}