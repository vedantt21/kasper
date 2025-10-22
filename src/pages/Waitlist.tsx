import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Heart } from "lucide-react";

export default function Waitlist() {
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

      if (profile?.status === "in_pool") {
        navigate("/match");
      }
    };

    // Check periodically if user has been moved to pool
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-primary">
      <Card className="w-full max-w-md shadow-glow border-0">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're on the Waitlist</CardTitle>
          <CardDescription>
            We're keeping the pool balanced for the best matching experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="py-8">
            <Heart className="w-16 h-16 mx-auto text-primary fill-primary opacity-50" />
          </div>
          <div className="space-y-2">
            <p className="font-medium">What does this mean?</p>
            <p className="text-sm text-muted-foreground">
              To ensure everyone has a fair chance at finding their match, we maintain a 1:1 ratio
              in our matching pool. You'll be notified as soon as a spot opens up!
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            This page will automatically update when you can start matching.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
