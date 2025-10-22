import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart, X, MessageCircle } from "lucide-react";

export default function Connection() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connection, setConnection] = useState<any>(null);
  const [otherProfile, setOtherProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    initializeConnection();
  }, []);

  const initializeConnection = async () => {
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

    // Get active connection
    const { data: conn } = await supabase
      .from("connections")
      .select("*")
      .or(`user_a_id.eq.${profile.id},user_b_id.eq.${profile.id}`)
      .eq("status", "pending")
      .maybeSingle();

    if (!conn) {
      // Check if already chatting
      const { data: chattingConn } = await supabase
        .from("connections")
        .select("*")
        .or(`user_a_id.eq.${profile.id},user_b_id.eq.${profile.id}`)
        .eq("status", "chatting")
        .maybeSingle();

      if (chattingConn) {
        navigate("/chat");
      } else {
        navigate("/match");
      }
      return;
    }

    setConnection(conn);

    // Get other user's profile
    const otherId = conn.user_a_id === profile.id ? conn.user_b_id : conn.user_a_id;
    const { data: other } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", otherId)
      .single();

    setOtherProfile(other);
    setLoading(false);
  };

  const handleConfirm = async (interested: boolean) => {
    if (!currentUser || !connection) return;
    setLoading(true);

    try {
      const isUserA = connection.user_a_id === currentUser.id;
      const updateField = isUserA ? "a_confirm" : "b_confirm";
      const otherField = isUserA ? "b_confirm" : "a_confirm";

      await supabase
        .from("connections")
        .update({ [updateField]: interested })
        .eq("id", connection.id);

      // Refresh connection data
      const { data: updatedConn } = await supabase
        .from("connections")
        .select("*")
        .eq("id", connection.id)
        .single();

      if (updatedConn.a_confirm !== null && updatedConn.b_confirm !== null) {
        // Both have responded
        if (updatedConn.a_confirm && updatedConn.b_confirm) {
          // Both interested - start chat
          await supabase
            .from("connections")
            .update({ status: "chatting" })
            .eq("id", connection.id);

          await supabase
            .from("profiles")
            .update({ status: "chatting" })
            .in("id", [connection.user_a_id, connection.user_b_id]);

          toast.success("It's a match! Start chatting! 💬");
          navigate("/chat");
        } else {
          // At least one not interested - return to pool
          await supabase
            .from("connections")
            .update({ status: "ended" })
            .eq("id", connection.id);

          await supabase
            .from("profiles")
            .update({ status: "in_pool", active_connection_id: null })
            .in("id", [connection.user_a_id, connection.user_b_id]);

          toast.info("No match this time. Back to the pool!");
          navigate("/match");
        }
      } else {
        toast.info(interested ? "Waiting for their response..." : "Declined. Going back to pool...");
        if (!interested) {
          // If you declined, wait a bit then go back
          setTimeout(() => navigate("/match"), 2000);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !otherProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const userConfirmed = connection.user_a_id === currentUser.id 
    ? connection.a_confirm 
    : connection.b_confirm;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-primary">
      <Card className="w-full max-w-md shadow-glow border-0">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {userConfirmed === null ? (
              <Heart className="w-8 h-8 text-primary fill-primary animate-pulse" />
            ) : userConfirmed ? (
              <MessageCircle className="w-8 h-8 text-primary" />
            ) : (
              <X className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl">You Both Liked Each Other!</CardTitle>
          <CardDescription>
            {userConfirmed === null 
              ? "Would you like to chat with them?" 
              : userConfirmed 
                ? "Waiting for their response..." 
                : "Response sent"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden shadow-soft mb-4">
              <img src={otherProfile.photo_url} alt="Match" className="w-full h-full object-cover" />
            </div>
            <p className="text-center text-muted-foreground">{otherProfile.intro_text}</p>
          </div>

          {userConfirmed === null && (
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => handleConfirm(false)}
                disabled={loading}
                className="flex-1 border-2"
              >
                <X className="w-5 h-5 mr-2" />
                Not Feeling It
              </Button>
              <Button
                onClick={() => handleConfirm(true)}
                disabled={loading}
                className="flex-1 gradient-primary hover:gradient-hover"
              >
                <Heart className="w-5 h-5 mr-2 fill-white" />
                I'm Interested
              </Button>
            </div>
          )}

          {userConfirmed !== null && (
            <div className="text-center text-sm text-muted-foreground">
              {userConfirmed 
                ? "We'll notify you when they respond!" 
                : "Returning you to the matching pool..."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
