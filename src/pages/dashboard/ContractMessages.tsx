import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, FileText, Image, Download, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  contract_id: string;
  file_url: string | null;
  is_read: boolean | null;
  created_at: string;
}

interface ContractWithDetails {
  id: string;
  client_id: string;
  freelancer_id: string;
  status: string;
  amount: number;
  project_title?: string;
  other_name?: string;
}

export default function ContractMessages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedContractId = searchParams.get("contract");
  const [messageText, setMessageText] = useState("");
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch contracts for the sidebar
  const { data: contracts = [] } = useQuery({
    queryKey: ["message-contracts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("contracts")
        .select("id, client_id, freelancer_id, status, amount, project_id")
        .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
        .in("status", ["in_progress", "under_review", "submitted", "needs_revision", "approved"]);
      if (error) throw error;

      // Fetch project titles & other party names
      const projectIds = [...new Set(data.map((c) => c.project_id))];
      const otherUserIds = [...new Set(data.map((c) => c.client_id === user.id ? c.freelancer_id : c.client_id))];

      const [projectsRes, profilesRes] = await Promise.all([
        supabase.from("projects").select("id, title").in("id", projectIds),
        supabase.from("profiles").select("user_id, full_name").in("user_id", otherUserIds),
      ]);

      const projectMap = Object.fromEntries((projectsRes.data || []).map((p) => [p.id, p.title]));
      const profileMap = Object.fromEntries((profilesRes.data || []).map((p) => [p.user_id, p.full_name]));

      return data.map((c) => ({
        id: c.id,
        client_id: c.client_id,
        freelancer_id: c.freelancer_id,
        status: c.status,
        amount: c.amount,
        project_title: projectMap[c.project_id] || "Untitled",
        other_name: profileMap[c.client_id === user.id ? c.freelancer_id : c.client_id] || "Unknown",
      })) as ContractWithDetails[];
    },
    enabled: !!user,
  });

  // Fetch messages for selected contract
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedContractId],
    queryFn: async () => {
      if (!selectedContractId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("contract_id", selectedContractId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedContractId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!selectedContractId) return;
    const channel = supabase
      .channel(`messages-${selectedContractId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `contract_id=eq.${selectedContractId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", selectedContractId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContractId, queryClient]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message
  const sendMutation = useMutation({
    mutationFn: async ({ content, fileUrl }: { content: string; fileUrl?: string }) => {
      if (!user || !selectedContractId) throw new Error("Missing context");
      const { error } = await supabase.from("messages").insert({
        contract_id: selectedContractId,
        sender_id: user.id,
        content,
        file_url: fileUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["messages", selectedContractId] });
    },
    onError: () => toast.error("Failed to send message"),
  });

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMutation.mutate({ content: messageText.trim() });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedContractId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${selectedContractId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("message-attachments")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("message-attachments")
        .getPublicUrl(path);

      sendMutation.mutate({
        content: `📎 ${file.name}`,
        fileUrl: urlData.publicUrl,
      });
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);

  const selectedContract = contracts.find((c) => c.id === selectedContractId);

  // Fetch profile names for messages
  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  const { data: senderProfiles = [] } = useQuery({
    queryKey: ["sender-profiles", senderIds.join(",")],
    queryFn: async () => {
      if (senderIds.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", senderIds);
      return data || [];
    },
    enabled: senderIds.length > 0,
  });
  const senderMap = Object.fromEntries(senderProfiles.map((p) => [p.user_id, p.full_name]));

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Contract list sidebar */}
      <Card className="w-72 flex-shrink-0 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Conversations
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="px-3 pb-3 space-y-1">
            {contracts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No active contracts</p>
            )}
            {contracts.map((c) => (
              <button
                key={c.id}
                onClick={() => setSearchParams({ contract: c.id })}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                  selectedContractId === c.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <p className="font-medium truncate">{c.project_title}</p>
                <p className={`text-xs mt-0.5 truncate ${selectedContractId === c.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {c.other_name}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col">
        {!selectedContractId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <h3 className="font-semibold text-sm">{selectedContract?.project_title}</h3>
                <p className="text-xs text-muted-foreground">with {selectedContract?.other_name}</p>
              </div>
              <Badge variant="outline">{selectedContract?.status}</Badge>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4" ref={scrollRef}>
              <div className="py-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Say hello!</p>
                )}
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-xl px-3.5 py-2.5 ${
                          isMine
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {!isMine && (
                          <p className="text-xs font-medium mb-1 opacity-70">
                            {senderMap[msg.sender_id] || "Unknown"}
                          </p>
                        )}
                        {msg.file_url && (
                          <div className="mb-1.5">
                            {isImageUrl(msg.file_url) ? (
                              <img src={msg.file_url} alt="attachment" className="rounded-lg max-w-full max-h-48 object-cover" />
                            ) : (
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 text-xs underline ${isMine ? "text-primary-foreground" : "text-foreground"}`}
                              >
                                <Download className="h-3.5 w-3.5" /> Download File
                              </a>
                            )}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {format(new Date(msg.created_at), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-shrink-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                disabled={sendMutation.isPending || uploading}
              />
              <Button
                onClick={handleSend}
                disabled={!messageText.trim() || sendMutation.isPending}
                size="icon"
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
