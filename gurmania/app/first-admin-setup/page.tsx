"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChefHat, ShieldCheck, Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  emailVerified: Date | null;
  createdAt: Date;
}

export default function FirstAdminSetupPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingAdmin, setSettingAdmin] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminStatus = async () => {
    try {
      // First, check if admin already exists
      const checkResponse = await fetch("/api/first-admin-setup/check");
      const checkData = await checkResponse.json();

      if (checkData.hasAdmin) {
        // Admin already exists, redirect to login
        router.push("/auth/login");
        return;
      }

      // Load all users
      const usersResponse = await fetch("/api/first-admin-setup/users");
      if (!usersResponse.ok) {
        throw new Error("Failed to load users");
      }

      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);
    } catch {
      setError("Greška pri učitavanju korisnika. Molimo osvježite stranicu.");
    } finally {
      setLoading(false);
    }
  };

  const setAsAdmin = async (userId: string) => {
    setSettingAdmin(userId);
    setError("");

    try {
      const response = await fetch("/api/first-admin-setup/set-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to set admin");
      }

      // Success! Redirect to login
      router.push("/auth/login?message=admin-setup-complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri postavljanju administratora");
    } finally {
      setSettingAdmin(null);
    }
  };

  const getUserInitials = (user: User) => {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          <p className="text-muted-foreground">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ChefHat className="w-12 h-12 text-orange-600" />
            <h1 className="text-4xl font-bold">Gurmania</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Inicijalno postavljanje</h2>
          <p className="text-muted-foreground">
            Odaberite korisnika koji će postati prvi administrator platforme
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Odabir administratora
            </CardTitle>
            <CardDescription>
              Ovo je jednokratna radnja koja se može izvršiti samo ako još nema administratora.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nema registriranih korisnika. Prvo se registrirajte, zatim se vratite ovdje.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push("/auth/register")}
                >
                  Registracija
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                        <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user.name || "Bez imena"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={user.emailVerified ? "default" : "secondary"} className="text-xs">
                            {user.emailVerified ? "Email potvrđen" : "Email nije potvrđen"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setAsAdmin(user.id)}
                      disabled={settingAdmin !== null}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {settingAdmin === user.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Postavljanje...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Postavi kao administratora
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Nakon postavljanja administratora, ova stranica više neće biti dostupna.
          </p>
          <p className="mt-2">
            Administrator može kasnije dodati druge administratore preko admin panela.
          </p>
        </div>
      </div>
    </div>
  );
}
