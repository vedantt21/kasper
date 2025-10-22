import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Loader2 } from "lucide-react";

export default function Waiting() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile?.status === "in_connection") {
        // Check if there's a pending connection
        const { data: conn } = await supabase
          .from("connections")
          .select("*")
          .or(`user_a_id.eq.${profile.id},user_b_id.eq.${profile.id}`)
          .eq("status", "pending")
          .maybeSingle();

        if (conn) {
          navigate("/connection");
        }
      } else if (profile?.status === "in_pool") {
        navigate("/match");
      } else if (profile?.status === "chatting") {
        navigate("/chat");
      }
    };

    // Check immediately
    checkStatus();

    // Set up polling
    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-primary">
      <Card className="w-full max-w-md shadow-glow border-0">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <CardTitle className="text-2xl">Waiting for Response</CardTitle>
          <CardDescription>
            We've sent your like! Now we're waiting for them to respond.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="py-8">
            <Heart className="w-16 h-16 mx-auto text-primary fill-primary opacity-50 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">
            This usually takes a few moments. We'll update you as soon as they respond!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
