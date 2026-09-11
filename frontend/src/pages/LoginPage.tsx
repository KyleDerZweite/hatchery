import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function LoginPage() {
  const { login, isLoading } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          H
        </span>
        <h1 className="mt-5 text-xl font-semibold">Sign in to Hatchery</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Turn a Modrinth or CurseForge modpack into a Pterodactyl egg.
        </p>

        <Button size="lg" className="mt-6 w-full" onClick={login} disabled={isLoading}>
          {isLoading ? "Signing in…" : "Continue with Zitadel"}
        </Button>
      </div>
    </main>
  );
}
