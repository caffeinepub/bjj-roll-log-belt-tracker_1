import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useActorWrapper } from './hooks/useActorWrapper';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginScreen from './components/LoginScreen';
import ProfileSetup from './components/ProfileSetup';
import Dashboard from './pages/Dashboard';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useEffect } from 'react';

export default function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const { actor, isFetching: actorFetching, actorReady, currentStep: initStep } = useActorWrapper();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const isAuthenticated = !!identity;
  const isInitializing = loginStatus === 'initializing';

  // Apply theme from localStorage immediately on mount (local-first)
  useEffect(() => {
    const storedTheme = localStorage.getItem('bjj-theme') || 'light';
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  // Show loading screen during Internet Identity initialization
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing Internet Identity...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Show actor connection status
  if (!actorReady || actorFetching) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Connecting to backend...</p>
          <p className="text-xs text-muted-foreground">Step: {initStep}</p>
        </div>
      </div>
    );
  }

  // Show profile loading
  if (profileLoading || !isFetched) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show Profile Setup if no profile exists
  if (isFetched && userProfile === null) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="bjj-theme">
        <div className="flex min-h-screen flex-col bg-background">
          <Header onProfileClick={() => {}} />
          <main className="flex-1">
            <ProfileSetup isEditing={false} onComplete={() => {}} />
          </main>
          <Footer />
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show main application if profile exists
  if (isFetched && userProfile && actorReady) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="bjj-theme">
        <div className="flex min-h-screen flex-col bg-background">
          <Header onProfileClick={() => setShowProfileEdit(true)} />
          <main className="flex-1">
            {showProfileEdit ? (
              <ProfileSetup isEditing={true} onComplete={() => setShowProfileEdit(false)} />
            ) : (
              <Dashboard />
            )}
          </main>
          <Footer />
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Fallback loading state
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
