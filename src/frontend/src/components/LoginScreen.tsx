import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield } from 'lucide-react';

export default function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg lens-icon-glow">
            <span className="text-3xl font-bold text-white">BJJ</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Jiu-Jitsu Journey</h1>
            <p className="mt-2 text-lg text-muted-foreground">Track your Brazilian Jiu-Jitsu journey</p>
          </div>
        </div>

        <Card className="border-2 lens-surface-glow">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Sign in to access your training log and track your progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full lens-gradient-bg hover:opacity-90"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  Login with Internet Identity
                </>
              )}
            </Button>

            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">
                Secure authentication powered by Internet Identity. Your data is stored on the Internet Computer
                blockchain.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-card p-4 lens-surface-glow">
            <div className="text-2xl font-bold text-bjj-blue">📊</div>
            <p className="mt-2 text-xs text-muted-foreground">Track Sessions</p>
          </div>
          <div className="rounded-lg bg-card p-4 lens-surface-glow">
            <div className="text-2xl font-bold text-bjj-purple">🥋</div>
            <p className="mt-2 text-xs text-muted-foreground">Belt Progress</p>
          </div>
          <div className="rounded-lg bg-card p-4 lens-surface-glow">
            <div className="text-2xl font-bold text-bjj-brown">📚</div>
            <p className="mt-2 text-xs text-muted-foreground">Technique Library</p>
          </div>
        </div>
      </div>
    </div>
  );
}
