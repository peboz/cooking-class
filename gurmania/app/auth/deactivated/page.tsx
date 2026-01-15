import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function DeactivatedAccountPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Račun deaktiviran</CardTitle>
          <CardDescription className="text-base">
            Vaš korisnički račun je privremeno deaktiviran
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="mb-2">
              Vaš račun je bio deaktiviran od strane administratora. To znači da trenutno ne možete pristupiti aplikaciji.
            </p>
            <p>
              Ako mislite da je došlo do greške ili želite više informacija, molimo kontaktirajte administratore sustava.
            </p>
          </div>
          
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/login" });
            }}
          >
            <Button type="submit" className="w-full" variant="outline">
              Odjavi se
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
