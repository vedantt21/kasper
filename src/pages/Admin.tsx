import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, MessageCircle, Heart } from "lucide-react";

const ADMIN_PASSWORD = "soulmatch2024";

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated]);

  const loadData = async () => {
    // Get ratio
    const { data: ratio } = await supabase.rpc("get_pool_ratio");
    
    // Get all profiles
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Get all connections
    const { data: allConnections } = await supabase
      .from("connections")
      .select("*")
      .order("created_at", { ascending: false });

    setStats(ratio);
    setProfiles(allProfiles || []);
    setConnections(allConnections || []);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-primary">
        <Card className="w-full max-w-md shadow-glow border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
            <CardDescription>Enter admin password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" className="w-full gradient-primary hover:gradient-hover">
                Login
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Password: soulmatch2024
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <Button onClick={() => setAuthenticated(false)}>Logout</Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.length}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.male_count || 0} males, {stats?.female_count || 0} females
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pool Ratio</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.ratio ? stats.ratio.toFixed(2) : "0"}:1
              </div>
              <p className="text-xs text-muted-foreground">Male to Female</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {connections.filter((c) => c.status === "chatting").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {connections.filter((c) => c.status === "pending").length} pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Profiles Table */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle>All Profiles</CardTitle>
            <CardDescription>Registered users and their statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Preference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.email}</TableCell>
                    <TableCell className="capitalize">{profile.gender}</TableCell>
                    <TableCell className="capitalize">{profile.preference}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          profile.status === "chatting"
                            ? "default"
                            : profile.status === "in_pool"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {profile.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Connections Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>All Connections</CardTitle>
            <CardDescription>Current and past connections</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Connection ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mutual Like</TableHead>
                  <TableHead>A Confirm</TableHead>
                  <TableHead>B Confirm</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((conn) => (
                  <TableRow key={conn.id}>
                    <TableCell className="font-mono text-xs">
                      {conn.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          conn.status === "chatting"
                            ? "default"
                            : conn.status === "pending"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {conn.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{conn.mutual_like ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {conn.a_confirm === null ? "-" : conn.a_confirm ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>
                      {conn.b_confirm === null ? "-" : conn.b_confirm ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>
                      {new Date(conn.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
