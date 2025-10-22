import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, ArrowLeft, Heart } from "lucide-react";

export default function Chat() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connection, setConnection] = useState<any>(null);
  const [otherProfile, setOtherProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (connection) {
      const channel = supabase
        .channel("messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `connection_id=eq.${connection.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [connection]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initializeChat = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (!profile) {
      navigate("/profile-setup");
      return;
    }

    setCurrentUser(profile);

    const { data: conn } = await supabase
      .from("connections")
      .select("*")
      .or(`user_a_id.eq.${profile.id},user_b_id.eq.${profile.id}`)
      .eq("status", "chatting")
      .maybeSingle();

    if (!conn) {
      navigate("/match");
      return;
    }

    setConnection(conn);

    const otherId = conn.user_a_id === profile.id ? conn.user_b_id : conn.user_a_id;
    const { data: other } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", otherId)
      .single();

    setOtherProfile(other);

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("connection_id", conn.id)
      .order("sent_at", { ascending: true });

    setMessages(msgs || []);
    setLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !connection || !currentUser) return;

    try {
      await supabase.from("messages").insert({
        connection_id: connection.id,
        sender_id: currentUser.id,
        text: newMessage.trim(),
      });

      setNewMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleEndChat = async () => {
    if (!connection) return;

    if (confirm("Are you sure you want to end this chat?")) {
      await supabase
        .from("connections")
        .update({ status: "ended" })
        .eq("id", connection.id);

      await supabase
        .from("profiles")
        .update({ status: "in_pool", active_connection_id: null })
        .in("id", [connection.user_a_id, connection.user_b_id]);

      toast.info("Chat ended. Back to the pool!");
      navigate("/match");
    }
  };

  if (loading || !otherProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="gradient-primary p-4 shadow-soft">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEndChat}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
              <img src={otherProfile.photo_url} alt="Match" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-semibold">Your Match</h2>
              <p className="text-xs opacity-90">Active now</p>
            </div>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isMe
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="break-words">{msg.text}</p>
                  <p className={`text-xs mt-1 ${isMe ? "opacity-90" : "opacity-60"}`}>
                    {new Date(msg.sent_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-card">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="gradient-primary hover:gradient-hover"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
