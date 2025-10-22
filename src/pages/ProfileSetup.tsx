import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Heart } from "lucide-react";

export default function ProfileSetup() {
  const [user, setUser] = useState<any>(null);
  const [intro, setIntro] = useState("");
  const [gender, setGender] = useState<string>("");
  const [preference, setPreference] = useState<string>("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkExistingProfile(session.user.id);
      }
    });
  }, [navigate]);

  const checkExistingProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    
    if (data) {
      navigate("/match");
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !photo) return;

    setLoading(true);

    try {
      // Upload photo to storage
      const fileExt = photo.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, photo);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      // Check pool ratio
      const { data: ratioData } = await supabase.rpc("get_pool_ratio");
      const ratio = ratioData as any;
      
      let status = "in_pool";
      if (gender === "male" && ratio.male_count > ratio.female_count + 5) {
        status = "waitlisted";
      } else if (gender === "female" && ratio.female_count > ratio.male_count + 5) {
        status = "waitlisted";
      }

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert([{
        id: user.id,
        email: user.email,
        gender: gender as "male" | "female" | "other",
        preference: preference as "male" | "female" | "other",
        intro_text: intro,
        photo_url: publicUrl,
        status: status as "in_pool" | "waitlisted",
      }]);

      if (profileError) throw profileError;

      if (status === "waitlisted") {
        toast.info("You're on the waitlist! We'll notify you when a spot opens.");
        navigate("/waitlist");
      } else {
        toast.success("Profile created! Let's find your match.");
        navigate("/match");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Your Profile</CardTitle>
          <CardDescription>Tell us a bit about yourself</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="photo">Profile Photo</Label>
              <div className="flex flex-col items-center gap-4">
                {photoPreview ? (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-soft">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  required
                  className="max-w-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intro">Introduction (max 200 characters)</Label>
              <Textarea
                id="intro"
                placeholder="Tell potential matches about yourself..."
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                maxLength={200}
                required
                className="resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">{intro.length}/200</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">I am</Label>
                <Select value={gender} onValueChange={setGender} required>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preference">Looking for</Label>
                <Select value={preference} onValueChange={setPreference} required>
                  <SelectTrigger id="preference">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-primary hover:gradient-hover transition-smooth"
              disabled={loading || !photo || !intro || !gender || !preference}
            >
              {loading ? "Creating Profile..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
