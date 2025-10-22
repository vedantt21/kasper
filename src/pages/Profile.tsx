import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, LogOut } from "lucide-react";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(data);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/match")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <div className="w-10" />
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full overflow-hidden shadow-soft">
                <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <CardTitle>{profile.email}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Introduction</p>
              <p className="text-foreground">{profile.intro_text}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Gender</p>
                <p className="text-foreground capitalize">{profile.gender}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Looking for</p>
                <p className="text-foreground capitalize">{profile.preference}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
              <p className="text-foreground capitalize">{profile.status.replace("_", " ")}</p>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
