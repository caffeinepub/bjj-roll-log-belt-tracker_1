import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useUpdateThemePreference } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';

interface HeaderProps {
  onProfileClick: () => void;
}

export default function Header({ onProfileClick }: HeaderProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const updateThemeMutation = useUpdateThemePreference();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    // Local-first: Immediately update UI and localStorage for instant feedback
    setTheme(newTheme);
    localStorage.setItem('bjj-theme', newTheme);
    
    // Asynchronously save to backend in the background without blocking UI
    if (isAuthenticated) {
      updateThemeMutation.mutate(newTheme);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-bjj-blue to-bjj-purple flex-shrink-0">
            <span className="text-xl font-bold text-white">🥋</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate lens-text-glow">Jiu-Jitsu Journey</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && userProfile && (
            <>
              {/* Desktop: Full profile button with Lens glow */}
              <button
                onClick={onProfileClick}
                className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 hover:opacity-90 transition-opacity cursor-pointer lens-profile-glow"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-bjj-blue to-bjj-purple flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {userProfile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">{userProfile.username}</span>
              </button>

              {/* Mobile: Icon button only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onProfileClick}
                className="sm:hidden"
                title={`Profile: ${userProfile.username}`}
              >
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Button>
            </>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isAuthenticated && (
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
