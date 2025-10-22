import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart, X, LogOut, User } from "lucide-react";

export default function Match() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
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

    // Check if user has an active connection
    if (profile.status === "in_connection" || profile.status === "chatting") {
      navigate("/connection");
      return;
    }

    if (profile.status === "waitlisted") {
      navigate("/waitlist");
      return;
    }

    // Get next profile to show
    await loadNextProfile(profile);
    setLoading(false);
  };

  const loadNextProfile = async (userProfile: any) => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", "in_pool")
      .eq("gender", userProfile.preference)
      .neq("id", userProfile.id)
      .limit(1);

    if (profiles && profiles.length > 0) {
      setCurrentProfile(profiles[0]);
    } else {
      setCurrentProfile(null);
      toast.info("No more profiles available right now. Check back later!");
    }
  };

  const handleLike = async () => {
    if (!currentProfile || !currentUser) return;
    setLoading(true);

    try {
      // Create like record
      await supabase.from("likes").insert({
        liker_id: currentUser.id,
        liked_id: currentProfile.id,
      });

      // Check if other person already liked us
      const { data: mutualLike } = await supabase
        .from("likes")
        .select("*")
        .eq("liker_id", currentProfile.id)
        .eq("liked_id", currentUser.id)
        .maybeSingle();

      if (mutualLike) {
        // Create connection
        const { data: connection } = await supabase
          .from("connections")
          .insert({
            user_a_id: currentUser.id,
            user_b_id: currentProfile.id,
            mutual_like: true,
          })
          .select()
          .single();

        // Update both users' statuses
        await supabase
          .from("profiles")
          .update({ status: "in_connection", active_connection_id: connection.id })
          .in("id", [currentUser.id, currentProfile.id]);

        toast.success("It's a match! 🎉");
        navigate("/connection");
      } else {
        // Update user status to in_connection (waiting for other person)
        await supabase
          .from("profiles")
          .update({ status: "in_connection" })
          .eq("id", currentUser.id);

        toast.info("Like sent! Waiting for their response...");
        navigate("/waiting");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!currentUser) return;
    await loadNextProfile(currentUser);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-primary p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-white fill-white" />
            <h1 className="text-2xl font-bold text-white">SoulMatch</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="text-white hover:bg-white/20"
            >
              <User className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {currentProfile ? (
          <div className="space-y-6">
            <Card className="overflow-hidden shadow-glow border-0">
              <div className="aspect-[3/4] relative">
                <img
                  src={currentProfile.photo_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                  <p className="text-lg leading-relaxed">{currentProfile.intro_text}</p>
                </div>
              </div>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                onClick={handleSkip}
                disabled={loading}
                className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 border-0 shadow-card transition-smooth"
              >
                <X className="w-8 h-8 text-gray-600" />
              </Button>
              <Button
                size="lg"
                onClick={handleLike}
                disabled={loading}
                className="w-20 h-20 rounded-full gradient-primary hover:gradient-hover shadow-glow transition-smooth"
              >
                <Heart className="w-8 h-8 text-white fill-white" />
              </Button>
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center shadow-card">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No More Profiles</h2>
            <p className="text-muted-foreground">Check back later for new matches!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
