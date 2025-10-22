import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Users, MessageCircle, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Check if user has profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile) {
        navigate("/match");
      } else {
        navigate("/profile-setup");
      }
    }
  };

  return (
    <div className="min-h-screen gradient-primary flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center text-white space-y-8">
          <div className="inline-block p-4 bg-white/10 rounded-full backdrop-blur-sm shadow-glow mb-4">
            <Heart className="w-20 h-20 fill-white" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            SoulMatch
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Find your soulmate, one connection at a time.
            <br />
            No endless swiping. No games. Just genuine connections.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 shadow-glow transition-smooth"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/admin")}
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-lg px-8 py-6 backdrop-blur-sm transition-smooth"
            >
              <Shield className="w-5 h-5 mr-2" />
              Admin Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/10 backdrop-blur-sm border-t border-white/20 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-white/10 rounded-full">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold">One Match at a Time</h3>
              <p className="text-white/80">
                Focus on one genuine connection instead of endless options.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-white/10 rounded-full">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold">Balanced Pool</h3>
              <p className="text-white/80">
                We maintain a 1:1 ratio for fair matching opportunities.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-white/10 rounded-full">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold">100% Free</h3>
              <p className="text-white/80">
                No hidden costs, no premium features. Completely free forever.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
